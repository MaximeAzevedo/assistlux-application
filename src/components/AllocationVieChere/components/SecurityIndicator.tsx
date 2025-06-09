import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Security,
  Shield,
  Lock,
  Verified
} from '@mui/icons-material';

interface SecurityIndicatorProps {
  level: 'low' | 'medium' | 'high';
  sessionActive?: boolean;
  encryptionEnabled?: boolean;
  auditTrail?: boolean;
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({
  level,
  sessionActive = true,
  encryptionEnabled = true,
  auditTrail = true
}) => {
  const getSecurityConfig = () => {
    switch (level) {
      case 'high':
        return {
          icon: <Security color="success" />,
          label: 'Sécurité Maximale',
          color: 'success' as const,
          description: 'Chiffrement AES-256, audit complet'
        };
      case 'medium':
        return {
          icon: <Shield color="warning" />,
          label: 'Sécurité Standard',
          color: 'warning' as const,
          description: 'Chiffrement standard, logs basiques'
        };
      case 'low':
        return {
          icon: <Lock color="error" />,
          label: 'Sécurité Minimale',
          color: 'error' as const,
          description: 'Protection de base'
        };
    }
  };

  const config = getSecurityConfig();

  return (
    <Tooltip title={config.description}>
      <Box display="flex" alignItems="center" gap={1}>
        {config.icon}
        <Stack direction="row" spacing={1}>
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
          />
          {sessionActive && (
            <Chip
              icon={<Verified />}
              label="Session Active"
              size="small"
              color="info"
            />
          )}
        </Stack>
      </Box>
    </Tooltip>
  );
};

export default SecurityIndicator; 