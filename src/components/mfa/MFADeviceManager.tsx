import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button, Card, Spinner, Modal, Form } from 'react-bootstrap';
import { EnhancedPingOneMfaService, type MfaDevice } from '../../services/enhancedPingOneMfaService';

interface MFADeviceManagerProps {
  credentials: {
    accessToken: string;
    environmentId: string;
    userId: string;
  };
  onDeviceAdded?: (device: MfaDevice) => void;
  onDeviceRemoved?: (deviceId: string) => void;
}

export const MFADeviceManager: React.FC<MFADeviceManagerProps> = ({
  credentials,
  onDeviceAdded,
  onDeviceRemoved,
}) => {
  const [devices, setDevices] = useState<MfaDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeDevice, setActiveDevice] = useState<MfaDevice | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<'SMS' | 'TOTP'>('TOTP');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const deviceList = await EnhancedPingOneMfaService.getDevices(credentials);
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load MFA devices:', error);
      toast.error('Failed to load MFA devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDevice = async () => {
    try {
      setIsAdding(true);
      
      if (selectedDeviceType === 'SMS' && !phoneNumber) {
        toast.error('Please enter a phone number');
        return;
      }

      if (selectedDeviceType === 'SMS') {
        await addSmsDevice();
      } else {
        await addTotpDevice();
      }
    } catch (error) {
      console.error('Failed to add device:', error);
      toast.error(`Failed to add device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const addSmsDevice = async () => {
    const device = await EnhancedPingOneMfaService.createDevice(credentials, 'SMS', {
      phoneNumber,
      name: 'SMS Device',
    });

    // In a real app, you would send an SMS challenge here
    // For now, we'll just show a success message
    toast.success('SMS device added successfully. Please check your phone for a verification code.');
    setActiveDevice(device);
    setShowAddModal(false);
  };

  const addTotpDevice = async () => {
    const { device, secret, qrCode } = await EnhancedPingOneMfaService.createTotpDevice(
      credentials,
      {
        name: 'Authenticator App',
        issuer: 'Your App',
        accountName: 'user@example.com',
      }
    );

    // Show the QR code and secret to the user
    setActiveDevice(device);
    setShowAddModal(false);
    
    // In a real app, you would show a modal with the QR code and secret
    // For now, we'll just show a success message
    toast.success('TOTP device added. Please scan the QR code with your authenticator app.');
    console.log('TOTP Secret:', secret); // In a real app, show this to the user in a secure way
    console.log('QR Code:', qrCode); // In a real app, display this image
  };

  const handleVerifyCode = async () => {
    if (!activeDevice) return;

    try {
      setIsActivating(true);
      
      await EnhancedPingOneMfaService.activateDevice(
        credentials,
        activeDevice.id,
        verificationCode
      );

      toast.success('Device activated successfully');
      setActiveDevice(null);
      setVerificationCode('');
      loadDevices();
      onDeviceAdded?.(activeDevice);
    } catch (error) {
      console.error('Failed to verify device:', error);
      toast.error(`Failed to verify device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to remove this device?')) {
      return;
    }

    try {
      await EnhancedPingOneMfaService.deleteDevice(credentials, deviceId);
      toast.success('Device removed successfully');
      setDevices(devices.filter(d => d.id !== deviceId));
      onDeviceRemoved?.(deviceId);
    } catch (error) {
      console.error('Failed to remove device:', error);
      toast.error(`Failed to remove device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderDeviceCard = (device: MfaDevice) => (
    <Card key={device.id} className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">{device.name || device.type} {device.status === 'ACTIVE' && <span className="badge bg-success">Active</span>}</h5>
            <p className="mb-1 text-muted">
              {device.phoneNumber || device.emailAddress || 'Authenticator App'}
            </p>
            <small className="text-muted">
              Added on {new Date(device.createdAt).toLocaleDateString()}
            </small>
          </div>
          <div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleRemoveDevice(device.id)}
              disabled={devices.length <= 1}
              title={devices.length <= 1 ? 'You must have at least one MFA device' : 'Remove device'}
            >
              Remove
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="mfa-device-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Multi-Factor Authentication</h4>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Add Device
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center my-5">
          <p>No MFA devices found. Add a device to enable multi-factor authentication.</p>
        </div>
      ) : (
        <div className="device-list">
          {devices.map(renderDeviceCard)}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add MFA Device</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Device Type</Form.Label>
              <Form.Select
                value={selectedDeviceType}
                onChange={(e) => setSelectedDeviceType(e.target.value as 'SMS' | 'TOTP')}
                disabled={isAdding}
              >
                <option value="TOTP">Authenticator App</option>
                <option value="SMS">SMS</option>
              </Form.Select>
            </Form.Group>

            {selectedDeviceType === 'SMS' && (
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isAdding}
                />
                <Form.Text className="text-muted">
                  We'll send a verification code to this number.
                </Form.Text>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddDevice} disabled={isAdding}>
            {isAdding ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" />
                <span className="ms-2">Adding...</span>
              </>
            ) : (
              'Add Device'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Verification Modal */}
      <Modal show={!!activeDevice} onHide={() => setActiveDevice(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Verify Device</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter the verification code sent to your device:</p>
          <Form.Control
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            disabled={isActivating}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setActiveDevice(null)} disabled={isActivating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleVerifyCode} disabled={!verificationCode || isActivating}>
            {isActivating ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" />
                <span className="ms-2">Verifying...</span>
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MFADeviceManager;
