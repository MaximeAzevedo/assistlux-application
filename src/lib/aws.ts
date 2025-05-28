import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients with error handling and retry logic
function createAwsClients() {
  try {
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    const region = import.meta.env.VITE_AWS_REGION || 'eu-west-3';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }

    const config = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 3, // Add retry logic
      retryMode: 'adaptive'
    };

    return {
      s3: new S3Client(config),
      textract: new TextractClient(config)
    };
  } catch (error) {
    console.error('Failed to initialize AWS clients:', error);
    throw new Error('AWS configuration error');
  }
}

let awsClients: ReturnType<typeof createAwsClients>;

function getAwsClients() {
  if (!awsClients) {
    awsClients = createAwsClients();
  }
  return awsClients;
}

export async function uploadToS3(imageData: string): Promise<string> {
  try {
    const clients = getAwsClients();
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('S3 bucket name not found in environment variables');
    }

    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image data format');
    }

    const base64Data = imageData.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `documents/${timestamp}-${uuidv4()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: binaryData,
      ContentType: 'image/jpeg',
      // Remove ACL parameter since bucket has ACLs disabled
      Metadata: {
        'upload-timestamp': timestamp,
        'content-type': 'document-scan'
      }
    });

    await clients.s3.send(command);
    return key;
  } catch (error: any) {
    console.error('S3 upload error:', error);
    
    if (error.name === 'NoSuchBucket') {
      throw new Error('S3 bucket does not exist');
    }
    
    if (error.name === 'AccessDenied') {
      throw new Error('Access denied to S3 bucket. Check IAM permissions.');
    }
    
    throw error;
  }
}

export async function analyzeWithTextract(s3Key: string) {
  try {
    const clients = getAwsClients();
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error('S3 bucket name not found in environment variables');
    }

    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: s3Key,
        },
      },
      FeatureTypes: ['FORMS', 'TABLES'], // Removed QUERIES feature type since we're not using it
    });

    const response = await clients.textract.send(command);
    return processTextractResponse(response);
  } catch (error: any) {
    console.error('Textract analysis error:', error);
    throw new Error(error.message || 'Failed to analyze document');
  }
}

function processTextractResponse(response: any) {
  try {
    const blocks = response.Blocks || [];
    const result = {
      text: '',
      fields: {} as Record<string, string>,
      tables: [] as any[],
    };

    blocks.forEach((block: any) => {
      if (block.BlockType === 'KEY_VALUE_SET') {
        const key = blocks.find((b: any) => 
          block.Relationships?.some((r: any) => 
            r.Type === 'CHILD' && r.Ids.includes(b.Id)
          )
        )?.Text;

        const value = blocks.find((b: any) => 
          block.Relationships?.some((r: any) => 
            r.Type === 'VALUE' && r.Ids.includes(b.Id)
          )
        )?.Text;

        if (key && value) {
          result.fields[key.trim()] = value.trim();
        }
      } else if (block.BlockType === 'LINE') {
        result.text += block.Text + '\n';
      }
    });

    return result;
  } catch (error) {
    console.error('Error processing Textract response:', error);
    throw new Error('Failed to process document analysis results');
  }
}