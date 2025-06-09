import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

interface StepInfo {
  label: string;
  description?: string;
}

interface ProgressionIndicatorProps {
  currentStep: number;
  steps: StepInfo[];
  progress: number;
  onStepClick?: (step: number) => void;
}

const ProgressionIndicator: React.FC<ProgressionIndicatorProps> = ({
  currentStep,
  steps,
  progress,
  onStepClick
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Progression de votre demande
          </Typography>
          <Chip 
            label={`${Math.round(progress)}%`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />
        
        <Stepper activeStep={currentStep} orientation="horizontal" alternativeLabel>
          {steps.map((step, index) => (
            <Step 
              key={index}
              onClick={onStepClick ? () => onStepClick(index) : undefined}
              sx={{ 
                cursor: onStepClick ? 'pointer' : 'default',
                '&:hover': onStepClick ? { bgcolor: 'action.hover' } : {}
              }}
            >
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  completed ? (
                    <CheckCircle color="success" />
                  ) : active ? (
                    <RadioButtonUnchecked color="primary" />
                  ) : (
                    <RadioButtonUnchecked color="disabled" />
                  )
                )}
              >
                <Typography variant="body2" fontWeight={index === currentStep ? 'bold' : 'normal'}>
                  {step.label}
                </Typography>
                {step.description && (
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default ProgressionIndicator; 