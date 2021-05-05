import { useState, useEffect } from 'react';
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function EditCandidateModal({ show, onHide, candidate = {} }) {
    const [newCandidate, setNewCandidate] = useState({});
    useEffect(() => {
        if (!candidate) {
            return;
        }
        setNewCandidate({ ...candidate });
    }, [show]);

    const handleChange = event => {
        console.log(event.target.name + ' - ' + event.target.value);
        setNewCandidate({ ...newCandidate, [event.target.name]: event.target.value });
    };

    const changeName = name => {
        // will be implemented later
    };

    return (
        <Modal {...{ show }} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton onClick={onHide}>
                <Modal.Title id="contained-modal-title-vcenter">Edit candidate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form inline>
                    <Form.Label className="my-1 mr-2">Name</Form.Label>
                    <input
                        className="my-1 mr-sm-2"
                        type="text"
                        name="name"
                        value={newCandidate.name}
                        onChange={handleChange}
                    />
                    <Button onClick={() => changeName()} className="my-1">
                        Change name
                    </Button>
                </Form>
                <div className="row">Nr. {candidate.id}</div>
                <div className="row">Name: {candidate.name}</div>
                <div className="row">Votes: {candidate.voteCount}</div>
                <div className="row">Status: {candidate.isActive ? 'Active' : 'Inactive'}</div>
                <div className="row">Address: {candidate.accountAddress}</div>
                <div className="row">Nominator: {candidate.nominator}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EditCandidateModal;
