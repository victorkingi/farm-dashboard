import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import {inputDeadSick} from "../../services/actions/DeadSickAction";
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";

function InputDeadSick(props) {
    const [state, setState] = useState({
        date: new Date(),
        category: 'deadSick'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numberRegex = /^([\d]+)$/;
        const noZeroRegex = /^(0*)$/;
        const arr = Object.entries(state);
        if (arr.length < 6) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "chickenNo") {
                if (noZeroRegex.test(arr[i][1])) {
                    setError('Chicken number cannot be zero');
                    setOpenError(true);
                    return;
                }
                if (!numberRegex.test(arr[i][1])) {
                    setError('Chicken number cannot be negative');
                    setOpenError(true);
                    return;
                }
                break;
            }
        }
        props.inputDeadSick(state, image);
        setOpenError(false);
        setOpen(true);
    };

    const handleDate = (date) => {
        setState({
            ...state,
            date: date
        });
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleSelect = (e) => {
        if (e.target) {
            if (e.target.files) {
                if (e.target.files[0]) {
                    setImage(e.target.files[0]);
                }
            }
            if (e.target?.value === '0') {
                if (e.target.id === 'replaced') {
                    setState({
                        ...state,
                        [e.target.id]: e.target.checked
                    });
                }
            } else {
                setState({
                    ...state,
                    [e.target.id]: e.target.value
                });
            }
        } else {
            if (e === "Dead" || e === "Sick") {
                setState({
                    ...state,
                    section: e
                });
            } else {
                setState({
                    ...state,
                    place: e
                });
            }
        }
    }

    const componentDidMount = () => {
        bsCustomFileInput.init()
    }
    useEffect(() => {
        componentDidMount();
    }, []);

        if (redirect) {
            return (
                <Redirect to='/'/>
            )
        }
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">Input Dead/Sick</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                                event.preventDefault();
                                setRedirect(true);
                            }}>Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Input Dead/Sick</li>
                        </ol>
                    </nav>
                </div>
                <div className="col-xl grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Input Dead/Sick</h4>
                            <p className="card-description"> Enter dead/sick chickens </p>
                            <form className="forms-sample">
                                <label htmlFor="date">Date</label>
                                <Form.Group>
                                    <DatePicker
                                        selected={state.date}
                                        onChange={handleDate}
                                        className='form-control'
                                        id='date'
                                    />
                                </Form.Group>
                                <label htmlFor="section">Section</label>
                                <DropdownButton
                                    alignRight
                                    title={state.section || ''}
                                    id="location"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Dead">Dead</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Sick">Sick</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <label htmlFor="location">Location</label>
                                <DropdownButton
                                    alignRight
                                    title={state.place || ''}
                                    id="location"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Cage">Cage</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="House">House</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <Form.Group>
                                    <label htmlFor="chickenNo">Number of Chickens</label>
                                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="chickenNo" placeholder="Number of Chickens" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="reason">Reason (and Treatment Given)</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control" id="reason" placeholder="Reason and Treatment If Applicable" />
                                </Form.Group>
                                <Form.Group>
                                    <label>File upload</label>
                                    <div className="custom-file">
                                        <Form.Control type="file" className="form-control visibility-hidden" id="photo" lang="es" onChange={handleSelect} />
                                        <label className="custom-file-label" htmlFor="photo">Upload image</label>
                                    </div>
                                </Form.Group>
                                <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
                <Online>
                    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="success">
                            Data Submitted, image will be uploaded
                        </Alert>
                    </Snackbar>
                </Online>
                <Offline>
                    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="warning">
                            Data will be submitted automatically when back online
                        </Alert>
                    </Snackbar>
                </Offline>
                <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                    <Alert severity="error">{error}!</Alert>
                </Snackbar>
            </div>
        )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputDeadSick: (deadSick, image) => dispatch(inputDeadSick(deadSick, image))
    }
}

export default connect(null, mapDispatchToProps)(InputDeadSick);
