import React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * A detailed view of an Investment.
 *
 * @param {{
 *   investment: { name: string, deployedAt: string },
 *   onRun?: (name: string) => void,
 *   onClose?: () => void,
 * }} props
 * @param props.investment  The investment data object.
 * @param props.onRun       Callback invoked when the "Run" button is clicked.
 * @param props.onClose     Callback invoked when the "Close" button is clicked.
 */
export function InvestmentDetails({ investment, onRun, onClose }) {
  const name = investment?.name ?? 'Unknown Investment';
  const deployedAt = investment?.deployedAt ?? '';

  return (
    <Card className="investment-details shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light">
        <Card.Title as="h5" className="mb-0">
          Investment Details
        </Card.Title>
        {onClose && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={8}>
            <label className="text-muted small">Name</label>
            <div className="font-monospace fw-bold">{name}</div>
          </Col>
          <Col md={4} className="text-md-end">
            <label className="text-muted small">Deployed At</label>
            <div className="text-body-secondary">{deployedAt}</div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div className="p-3 bg-light rounded border">
              <p className="text-muted mb-0">
                This view provides a comprehensive look at the specific investment's deployment details.
              </p>
            </div>
          </Col>
        </Row>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onClose}
          disabled={!onClose}
        >
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onRun?.(name)}
          disabled={!onRun}
        >
          <FontAwesomeIcon icon={faPlay} className="me-1" aria-hidden="true" />
          Run Investment
        </Button>
      </Card.Footer>
    </Card>
  );
}

export default InvestmentDetails;
