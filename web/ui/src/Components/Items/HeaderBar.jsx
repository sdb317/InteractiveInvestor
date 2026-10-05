// Feature: ai-workflow-create
//
// Header bar component for the AI Workflow Create SPA.
// Validates: Requirements 1.1, 2.1, 3.1, 16.3
//
// Renders a react-bootstrap Navbar with:
//   - Left: hamburger icon button to toggle the project menu
//   - Center: brand showing the project name or default title
//   - Right: Delete project button (visible only when a project is loaded)

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

/**
 * HeaderBar component.
 *
 * @param {{ project: object|null, onNew: () => void, onOpen: () => void, onHelp: () => void }} props
 */
function HeaderBar({ project, onNew, onOpen, onHelp }) {
  return (
    <Navbar bg="dark" data-bs-theme="dark">
      <Container>
        {/*
        <Navbar.Brand className="d-flex align-items-center p-0 me-2">
          <img
            src=".svg"
            height="64"
            alt=""
          />
        </Navbar.Brand>
        */}
        <Navbar.Brand href="#home">Investments</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link as="button" onClick={onNew}>New</Nav.Link>
          <Nav.Link as="button" onClick={onOpen}>Open</Nav.Link>
        </Nav>
        <Nav className="justify-content-end">
          <Nav.Link as="button" onClick={onHelp} className="ms-auto">Help</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
export { HeaderBar };
