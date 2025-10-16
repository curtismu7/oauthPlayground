// src/components/AuthorizationDetailsEditor.tsx
// Enhanced Authorization Details Editor with JSON editor and real-time validation

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiCode, FiEdit3, FiAlertCircle, FiCheckCircle, FiTrash2, FiPlus } from 'react-icons/fi';
import RARService, { type AuthorizationDetail, type RARValidationResult } from '../services/rarService';

interface AuthorizationDetailsEditorProps {
  authorizationDetails: AuthorizationDetail[];
  onUpdate: (details: AuthorizationDetail[]) => void;
  className?: string;
}

type ViewMode = 'visual' | 'json';

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ViewModeToggle = styled.div`
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
`;

const ViewModeButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }
`;

const ValidationStatus = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${props => props.isValid ? '#f0fdf4' : '#fef2f2'};
  border: 1px solid ${props => props.isValid ? '#bbf7d0' : '#fecaca'};
  color: ${props => props.isValid ? '#166534' : '#991b1b'};
  font-size: 0.875rem;
`;

const ErrorList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
`;

const JsonEditor = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const VisualEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DetailItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  background: #f9fafb;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DetailType = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ArrayInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ArrayItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ArrayItemInput = styled(Input)`
  flex: 1;
`;

const ArrayItemRemove = styled.button`
  padding: 0.25rem;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;

  &:hover {
    background: #dc2626;
  }
`;

const AddArrayItem = styled.button`
  padding: 0.5rem;
  border: 1px dashed #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const AddDetailButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px dashed #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  width: 100%;
  justify-content: center;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

export const AuthorizationDetailsEditor: React.FC<AuthorizationDetailsEditorProps> = ({
  authorizationDetails,
  onUpdate,
  className
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [jsonValue, setJsonValue] = useState('');
  const [validation, setValidation] = useState<RARValidationResult>({ valid: true, errors: [] });

  // Update JSON when authorization details change
  useEffect(() => {
    setJsonValue(JSON.stringify(authorizationDetails, null, 2));
  }, [authorizationDetails]);

  // Validate authorization details
  useEffect(() => {
    const result = RARService.validateAuthorizationDetails(authorizationDetails);
    setValidation(result);
  }, [authorizationDetails]);

  const handleJsonChange = useCallback((value: string) => {
    setJsonValue(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        onUpdate(parsed);
      }
    } catch (error) {
      // Invalid JSON, don't update
    }
  }, [onUpdate]);

  const updateDetail = useCallback((index: number, field: string, value: any) => {
    const updated = [...authorizationDetails];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  }, [authorizationDetails, onUpdate]);

  const removeDetail = useCallback((index: number) => {
    const updated = authorizationDetails.filter((_, i) => i !== index);
    onUpdate(updated);
  }, [authorizationDetails, onUpdate]);

  const addDetail = useCallback(() => {
    const templates = RARService.getTemplates();
    const newDetail = { ...templates.customerInformation };
    onUpdate([...authorizationDetails, newDetail]);
  }, [authorizationDetails, onUpdate]);

  const updateArrayField = useCallback((detailIndex: number, field: string, arrayIndex: number, value: string) => {
    const updated = [...authorizationDetails];
    const detail = { ...updated[detailIndex] };
    const array = [...(detail[field] || [])];
    array[arrayIndex] = value;
    detail[field] = array;
    updated[detailIndex] = detail;
    onUpdate(updated);
  }, [authorizationDetails, onUpdate]);

  const addArrayItem = useCallback((detailIndex: number, field: string) => {
    const updated = [...authorizationDetails];
    const detail = { ...updated[detailIndex] };
    const array = [...(detail[field] || [])];
    array.push('');
    detail[field] = array;
    updated[detailIndex] = detail;
    onUpdate(updated);
  }, [authorizationDetails, onUpdate]);

  const removeArrayItem = useCallback((detailIndex: number, field: string, arrayIndex: number) => {
    const updated = [...authorizationDetails];
    const detail = { ...updated[detailIndex] };
    const array = [...(detail[field] || [])];
    array.splice(arrayIndex, 1);
    detail[field] = array;
    updated[detailIndex] = detail;
    onUpdate(updated);
  }, [authorizationDetails, onUpdate]);

  const renderArrayField = (detailIndex: number, field: string, values: string[] = []) => (
    <ArrayInput>
      {values.map((value, arrayIndex) => (
        <ArrayItem key={arrayIndex}>
          <ArrayItemInput
            value={value}
            onChange={(e) => updateArrayField(detailIndex, field, arrayIndex, e.target.value)}
            placeholder={`${field} item`}
          />
          <ArrayItemRemove onClick={() => removeArrayItem(detailIndex, field, arrayIndex)}>
            ×
          </ArrayItemRemove>
        </ArrayItem>
      ))}
      <AddArrayItem onClick={() => addArrayItem(detailIndex, field)}>
        <FiPlus size={12} />
        Add {field}
      </AddArrayItem>
    </ArrayInput>
  );

  const renderVisualEditor = () => (
    <VisualEditor>
      {authorizationDetails.map((detail, index) => (
        <DetailItem key={index}>
          <DetailHeader>
            <DetailType>{detail.type || 'Untitled Authorization Detail'}</DetailType>
            <RemoveButton onClick={() => removeDetail(index)}>
              <FiTrash2 size={14} />
            </RemoveButton>
          </DetailHeader>
          
          <FieldGrid>
            <FieldGroup>
              <Label>Type</Label>
              <Input
                value={detail.type || ''}
                onChange={(e) => updateDetail(index, 'type', e.target.value)}
                placeholder="e.g., customer_information"
              />
            </FieldGroup>

            {detail.type === 'customer_information' && (
              <>
                <FieldGroup>
                  <Label>Actions</Label>
                  {renderArrayField(index, 'actions', detail.actions)}
                </FieldGroup>
                <FieldGroup>
                  <Label>Data Types</Label>
                  {renderArrayField(index, 'datatypes', detail.datatypes)}
                </FieldGroup>
                <FieldGroup>
                  <Label>Locations</Label>
                  {renderArrayField(index, 'locations', detail.locations)}
                </FieldGroup>
              </>
            )}

            {detail.type === 'payment_initiation' && (
              <>
                <FieldGroup>
                  <Label>Amount</Label>
                  <Input
                    value={detail.instructedAmount?.amount || ''}
                    onChange={(e) => updateDetail(index, 'instructedAmount', {
                      ...detail.instructedAmount,
                      amount: e.target.value
                    })}
                    placeholder="250.00"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Currency</Label>
                  <Input
                    value={detail.instructedAmount?.currency || ''}
                    onChange={(e) => updateDetail(index, 'instructedAmount', {
                      ...detail.instructedAmount,
                      currency: e.target.value
                    })}
                    placeholder="USD"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Creditor Name</Label>
                  <Input
                    value={detail.creditorName || ''}
                    onChange={(e) => updateDetail(index, 'creditorName', e.target.value)}
                    placeholder="ABC Supplies"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Creditor IBAN</Label>
                  <Input
                    value={detail.creditorAccount?.iban || ''}
                    onChange={(e) => updateDetail(index, 'creditorAccount', {
                      ...detail.creditorAccount,
                      iban: e.target.value
                    })}
                    placeholder="DE89370400440532013000"
                  />
                </FieldGroup>
              </>
            )}

            {detail.type === 'account_information' && (
              <>
                <FieldGroup>
                  <Label>Accounts</Label>
                  {renderArrayField(index, 'accounts', detail.accounts)}
                </FieldGroup>
                <FieldGroup>
                  <Label>Include Balances</Label>
                  <Input
                    type="checkbox"
                    checked={detail.balances || false}
                    onChange={(e) => updateDetail(index, 'balances', e.target.checked)}
                  />
                </FieldGroup>
              </>
            )}
          </FieldGrid>
        </DetailItem>
      ))}
      
      <AddDetailButton onClick={addDetail}>
        <FiPlus size={16} />
        Add Authorization Detail
      </AddDetailButton>
    </VisualEditor>
  );

  return (
    <Container className={className}>
      <Header>
        <Title>Authorization Details (RAR)</Title>
        <ViewModeToggle>
          <ViewModeButton
            active={viewMode === 'visual'}
            onClick={() => setViewMode('visual')}
          >
            <FiEdit3 size={14} />
            Visual Editor
          </ViewModeButton>
          <ViewModeButton
            active={viewMode === 'json'}
            onClick={() => setViewMode('json')}
          >
            <FiCode size={14} />
            JSON Editor
          </ViewModeButton>
        </ViewModeToggle>
      </Header>

      <ValidationStatus isValid={validation.valid}>
        {validation.valid ? (
          <>
            <FiCheckCircle size={16} />
            Authorization details are valid
          </>
        ) : (
          <>
            <FiAlertCircle size={16} />
            <div>
              Validation errors found:
              <ErrorList>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ErrorList>
            </div>
          </>
        )}
      </ValidationStatus>

      {viewMode === 'visual' ? (
        renderVisualEditor()
      ) : (
        <JsonEditor
          value={jsonValue}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder="Enter authorization details as JSON array..."
        />
      )}
    </Container>
  );
};

export default AuthorizationDetailsEditor;