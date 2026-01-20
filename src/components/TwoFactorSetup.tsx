import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  generateSecret, 
  generateBackupCodes,
  hashBackupCode 
} from '@/lib/totp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
}

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

/**
 * Generate QR code locally (no external API)
 * SECURITY: Keeps TOTP secret in browser, not sent to third party
 */
async function generateQRCodeDataUrl(secret: string, email: string, issuer = 'HarmonyHub'): Promise<string> {
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return await QRCode.toDataURL(otpauth, { width: 200, margin: 2 });
}

export function TwoFactorSetup({ 
  isOpen, 
  onClose, 
  userEmail, 
  userId,
  onSuccess 
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);

  useEffect(() => {
    if (isOpen && step === 'intro') {
      // Generate new secret when dialog opens
      const newSecret = generateSecret();
      setSecret(newSecret);
      // Generate QR code locally (no external API call)
      generateQRCodeDataUrl(newSecret, userEmail).then(setQrUrl);
      setBackupCodes(generateBackupCodes());
    }
  }, [isOpen, step, userEmail]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setBackupCopied(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setBackupCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Hash backup codes for storage
      const hashedCodes = await Promise.all(
        backupCodes.map(code => hashBackupCode(code))
      );

      // SECURITY: Call Edge Function to verify and store 2FA server-side
      const { data, error } = await supabase.functions.invoke('setup_2fa', {
        body: { 
          secret, 
          code: verificationCode,
          backup_codes: hashedCodes 
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid code. Please try again.');
        setIsVerifying(false);
        return;
      }

      setStep('backup');
    } catch (error) {
      console.error('2FA setup error:', error);
      toast.error('Failed to enable 2FA. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setStep('intro');
    setVerificationCode('');
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Secure Your Account</h3>
              <p className="text-muted-foreground">
                Add an extra layer of security with two-factor authentication. 
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>
            </div>
            <Button onClick={() => setStep('scan')} className="w-full">
              Get Started
            </Button>
          </motion.div>
        );

      case 'scan':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <img src={qrUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Or enter this code manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded-lg text-sm font-mono text-center break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopySecret}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              I've scanned the code
            </Button>
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Verify Setup</h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono"
            />

            <Button 
              onClick={handleVerify} 
              className="w-full"
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable 2FA'
              )}
            </Button>

            <Button variant="ghost" onClick={() => setStep('scan')} className="w-full">
              Back to QR Code
            </Button>
          </motion.div>
        );

      case 'backup':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <p className="text-sm">
                <strong>Save these backup codes!</strong> You'll need them if you lose access to your authenticator app.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono text-center py-1">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleCopyBackupCodes} 
              className="w-full"
            >
              {backupCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Codes
                </>
              )}
            </Button>

            <Button onClick={handleComplete} className="w-full">
              I've Saved My Codes
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Protect your account with 2FA
          </DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
