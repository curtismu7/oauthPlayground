import React from 'react';
import './styles/protocol.css';

export type StepStatus = 'pending' | 'active' | 'completed';

interface FlowStepProps {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  protocol?: {
    method: string;
    url: string;
    params?: Array<{ key: string; value: string; comment?: string }>;
  };
  annotation?: {
    icon?: string;
    title: string;
    body: string;
  };
}

export const FlowStep: React.FC<FlowStepProps> = ({
  number,
  title,
  description,
  status,
  protocol,
  annotation,
}) => {
  return (
    <div className="flow-step">
      <div className={`flow-badge flow-badge-${status}`}>{number}</div>

      <div className="flow-title">{title}</div>
      <div className="flow-description">{description}</div>

      {protocol && (
        <div className="protocol-block">
          <div className="protocol-line">
            <span className="protocol-method">{protocol.method}</span>
            <span className="protocol-url"> {protocol.url}</span>
          </div>
          {protocol.params?.map((param, idx) => (
            <div key={idx} className="protocol-line">
              <span className="protocol-param">{param.key}</span>=
              <span className="protocol-value">{param.value}</span>
              {param.comment && <span className="protocol-comment"> {param.comment}</span>}
            </div>
          ))}
        </div>
      )}

      {annotation && (
        <div className="annotation">
          <div className="annotation-title">
            {annotation.icon} {annotation.title}
          </div>
          <div>{annotation.body}</div>
        </div>
      )}
    </div>
  );
};
