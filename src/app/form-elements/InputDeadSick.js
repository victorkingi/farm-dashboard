import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";

//df
function InputSell() {
    const [state, setState] = useState({
        date: new Date(),
        section: 'Choose Section',
        place: 'Choose Location',
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
        setOpenError(false);
        setOpen(true);
    };

    const handleDate = (date) => {
        setState({
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

        console.log(state, image);
        if (redirect) {
            return (
                <Redirect to='/dashboard'/>
            )
        }
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">Input Dead/Sick</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a href="!#" onClick={event => {
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
                                <DropdownButton
                                    alignRight
                                    title={state.section}
                                    id="dropdown-menu-align-right"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Dead">Dead</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Sick">Sick</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <DropdownButton
                                    alignRight
                                    title={state.place}
                                    id="dropdown-menu-align-right"
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
                                <div className="form-check">
                                    <label htmlFor="replaced" className="form-check-label text-muted">
                                        <input type="checkbox" onChange={handleSelect} className="form-check-input" id="replaced" name="replaced" defaultValue={0} />
                                        <i className="input-helper"></i>
                                        Replace wrong entry
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Data Submitted
                    </Alert>
                </Snackbar>
                <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                    <Alert severity="error">{error}!</Alert>
                </Snackbar>
            </div>
        )
}

export default InputSell
