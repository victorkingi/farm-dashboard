import React, { useEffect, useState } from 'react';
import {connect} from 'react-redux';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import {Redirect} from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {inputSell} from "../../services/actions/salesAction";
import { Offline, Online } from "react-detect-offline";

//df
function InputSell(props) {
  const [state, setState] = useState({
    date: new Date(),
    section: 'Choose Section',
    buyerName: ''
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const arr = Object.entries(state);
    const trayRegex = /^([\d]+)$/;
    const noZeroRegex = /^(0*)$/;

    if (arr.length < 5) {
      setError('All Inputs should be filled');
      setOpenError(true);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] === "") {
        setError('All Inputs should be filled');
        setOpenError(true);
        return;
      }
      if (arr[i][0] === "section") {
        if (arr[i][1] === "Choose Section") {
          setError('Section should be selected');
          setOpenError(true);
          return;
        }
        if (arr[i][1] !== "Other") {
          if (state.section !== state.buyerName) {
            setError('Section and buyer name should be the same');
            setOpenError(true);
            return;
          }
        } else {
          if (state.section === state.buyerName) {
            setError('Section and buyer name should not be equal');
            setOpenError(true);
            return;
          }
        }
      }
      if (arr[i][0] === "trayNo" || arr[i][0] === "trayPrice") {
        if (!trayRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be negative');
          setOpenError(true);
          return;
        }
      if (noZeroRegex.test(arr[i][1])) {
        setError('Tray price and amount cannot be zero');
        setOpenError(true);
        return;
      }
      }
    }
    props.inputSell(state);
    setOpenError(false);
    setOpen(true);
  };

  const handleDate = (date) => {
    setState({
      ...state,
      date: date
    });
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setOpenError(false);
  };

  const handleSelect = (e) => {
    if (e.target) {
      if (e.target?.value === '0') {
        if (e.target.id === 'paid' || e.target.id === 'not_paid') {
          const paid = document.getElementById('paid').checked;
          const not_paid = document.getElementById('not_paid').checked;
          setState({
            ...state,
            paid,
            not_paid
          });
        } else {
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
      setState({
        ...state,
        section: e,
        buyerName: e
      });
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
    console.log(state);
    //cds
    return (
        <div>
          <div className="page-header">
            <h3 className="page-title">Input Sales</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="/" onClick={event => {
                  event.preventDefault();
                  setRedirect(true);
                }}>Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Input Sales</li>
              </ol>
            </nav>
          </div>
          <div className="col-xl grid-margin stretch-card">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Input Sale</h4>
                <p className="card-description"> Enter sales made </p>
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
                  <Form.Group>
                    <label htmlFor="section">Section</label>
                    <DropdownButton
                        alignRight
                        title={state.section || 'Choose Section'}
                        id="dropdown-menu-align-right"
                        onSelect={handleSelect}
                    >
                      <Dropdown.Item eventKey="Thika Farmers">Thika Farmers</Dropdown.Item>
                      <Dropdown.Item eventKey="Cakes">Cakes</Dropdown.Item>
                      <Dropdown.Item eventKey="Duka">Duka</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item eventKey="Other">Other</Dropdown.Item>
                    </DropdownButton>
                  </Form.Group>
                  <Form.Group>
                    <label htmlFor="buyerName">Buyer Name</label>
                    <Form.Control type="text"
                                  onChange={handleSelect}
                                  className="form-control" id="buyerName" placeholder="Name of Buyer" />
                  </Form.Group>
                  <Form.Group>
                    <label htmlFor="trayNo">Number of Trays</label>
                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="trayNo" placeholder="Number of Trays" />
                  </Form.Group>
                  <Form.Group>
                    <label htmlFor="trayPrice">Price per Tray</label>
                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="trayPrice" placeholder="Price per Tray" />
                  </Form.Group>
                  <div className="col-md-6">
                    <Form.Group>
                      <div className="form-check">
                        <label htmlFor="1" className="form-check-label">
                          <input type="radio" onChange={handleSelect} className="form-check-input" name="status" id="paid" defaultChecked defaultValue={0}/>
                          <i className="input-helper"/>
                          Paid
                        </label>
                      </div>
                      <div className="form-check">
                        <label htmlFor="0" className="form-check-label">
                          <input type="radio" onChange={handleSelect} className="form-check-input" name="status" id="not_paid" defaultValue={0} />
                          <i className="input-helper"/>
                          Not Paid
                        </label>
                      </div>
                      <div className="form-check">
                        <label htmlFor="replaced" className="form-check-label text-muted">
                          <input type="checkbox" onChange={handleSelect} className="form-check-input" id="replaced" name="replaced" defaultValue={0} />
                          <i className="input-helper"/>
                          Replace an entry
                        </label>
                      </div>
                    </Form.Group>
                  </div>
                  <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                </form>
              </div>
            </div>
          </div>
          <Online>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
              <Alert onClose={handleClose} severity="success">
                Data Submitted
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
    inputSell: (sale) => dispatch(inputSell(sale))
  }
}

export default connect(null, mapDispatchToProps)(InputSell)
