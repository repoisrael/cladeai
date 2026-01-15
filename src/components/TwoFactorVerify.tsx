import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyTOTP, verifyBackupCode } from '@/lib/totp';
import { toast } from 'sonner';

interface TwoFactorVerifyProps {
  secret: string;
  hashedBackupCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
  onBackupCodeUsed?: (index: number) => void;
}

export function TwoFactorVerify({ 
  secret, 
  hashedBackupCodes,
  onSuccess, 
  onCancel,
  onBackupCodeUsed
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (useBackupCode) {
      if (code.length < 8) {
        toast.error('Please enter a valid backup code');
        return;
      }
    } else {
      if (code.length !== 6) {
        toast.error('Please enter a 6-digit code');
        return;
      }
    }

    setIsVerifying(true);

    try {
      if (useBackupCode) {
        const codeIndex = await verifyBackupCode(code, hashedBackupCodes);
        if (codeIndex === -1) {
          toast.error('Invalid backup code');
          setIsVerifying(false);
          return;
        }
        // Notify parent to remove used backup code
        onBackupCodeUsed?.(codeIndex);
        toast.success('Backup code accepted');
        onSuccess();
      } else {
        const isValid = await verifyTOTP(secret, code);
        if (!isValid) {
          toast.error('Invalid code. Please try again.');
          setIsVerifying(false);
          return;
        }
        onSuccess();
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto p-6 bg-card rounded-2xl shadow-xl border border-border space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          {useBackupCode ? (
            <Key className="w-8 h-8 text-primary" />
          ) : (
            <Shield className="w-8 h-8 text-primary" />
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {useBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {useBackupCode 
            ? 'Enter one of your backup codes'
            : 'Enter the code from your authenticator app'
          }
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          inputMode={useBackupCode ? 'text' : 'numeric'}
          pattern={useBackupCode ? undefined : '[0-9]*'}
          maxLength={useBackupCode ? 9 : 6}
          placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
          value={code}
          onChange={(e) => setCode(useBackupCode 
            ? e.target.value.toUpperCase() 
            : e.target.value.replace(/\D/g, '')
          )}
          className="text-center text-2xl tracking-widest font-mono"
          autoFocus
        />

        <Button 
          onClick={handleVerify} 
          className="w-full"
          disabled={isVerifying || (useBackupCode ? code.length < 8 : code.length !== 6)}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="flex-1"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
          >
            {useBackupCode ? 'Use authenticator' : 'Use backup code'}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
