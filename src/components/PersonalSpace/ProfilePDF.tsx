import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { UserProfile } from '../../types/user';

interface ProfilePDFProps {
  profile: UserProfile;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  field: {
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 12,
  },
});

const ProfilePDF: React.FC<ProfilePDFProps> = ({ profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Informations Personnelles</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Nom complet</Text>
          <Text style={styles.value}>{`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Genre</Text>
          <Text style={styles.value}>{profile.personalInfo.gender}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Date de naissance</Text>
          <Text style={styles.value}>
            {profile.personalInfo.dateOfBirth?.toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Contact</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Email principal</Text>
          <Text style={styles.value}>{profile.contact.primaryEmail}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Téléphone principal</Text>
          <Text style={styles.value}>{profile.contact.primaryPhone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Adresse</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Adresse complète</Text>
          <Text style={styles.value}>
            {`${profile.address.street}\n${profile.address.postalCode} ${profile.address.city}\n${profile.address.country}`}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default ProfilePDF;