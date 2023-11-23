import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Redirect } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from './InputEggs';
import { inputSell } from '../../services/actions/salesAction';
import { Offline, Online } from 'react-detect-offline';
import { firebase } from '../../services/api/fbConfig';
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";

function InputSell(props) {
  const { extraData } = props;

  const [state, setState] = useState({
    category: 'sales',
    date: new Date(),
    buyer_name: '',
    tray_price: '350',
    tray_no: '1',
    receiver: localStorage.getItem('name'),
    extra_data: ''
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  const [buyer_names, setBuyerNames] = useState([]);

  let name = firebase.auth().currentUser?.displayName;
  name = name ? name.substring(0, name.lastIndexOf(' '))
      .toUpperCase() : '';

  useEffect(() => {
    if (extraData) {
      setBuyerNames(extraData[0].buyer_names || []);
    }
  }, [extraData]);

  const checkDate = (date) => {
    if (date.getTime() > new Date().getTime()) {
      setError('Invalid date');
      setOpenError(true);
      return false;
    } else {
      return true;
    }
  };

  const parameterChecks = (values) => {
    if (!values.name) {
      setError('User undefined');
      setOpenError(true);
      return false;
    }
    const stripBuyer = values.buyer_name.trim().toUpperCase();
    const validNames = buyer_names.map(x => x.toUpperCase());

    if (!validNames.includes(stripBuyer)) {
      setError('Buyer name does not exist.');
      setOpenError(true);
      return false;
    }
    values.buyer_name = stripBuyer;

    return checkDate(values.date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const arr = Object.entries(state);
    const trayRegex = /^([0-9]+)$/;
    const noZeroRegex = /^(0*)$/;
    const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;

    if (arr.length < 5) {
      setError('All Inputs should be filled');
      setOpenError(true);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] === '' && arr[i][0] !== 'extra_data') {
        setError('All Inputs should be filled');
        setOpenError(true);
        return;
      }
      if (arr[i][0] === 'tray_no' || arr[i][0] === 'tray_price') {
        if (!trayRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be negative or not a number');
          setOpenError(true);
          return;
        }
        if (noZeroRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be zero');
          setOpenError(true);
          return;
        }
      }
      if (arr[i][0] === 'extra_data' && !alphaNumRegex.test(arr[i][1])) {
        setError('Extra info should only be letters/numbers or left empty');
        setOpenError(true);
        return;
      }
    }
    let status = true;
    if (state.not_paid) {
      status = false;
    }
    const values = {
      ...state,
      name,
      status
    };
    values.tray_no = parseInt(values.tray_no);
    values.tray_price = parseInt(values.tray_price);
  
    delete values.not_paid;
    delete values.paid;
    if (!values.flock) values.subgroups = "0::0;1::0";
    delete values.flock;
    if (!values.status && localStorage.getItem('name') !== values.receiver) {
      setError('Sale should be paid if money was transferred');
      setOpenError(true);
      return -1;
    }
    if (!values.status) values.receiver = '';
    else values.receiver = `${values.receiver.toUpperCase()}:${parseInt(values.tray_no)*parseInt(values.tray_price)},`;
    let date = new Date(values.date);
    date.setHours(0, 0, 0, 0);
    values.date = date;
    let proceed = parameterChecks(values);
    if (proceed) {
        props.inputSell(values);
        setOpenError(false);
        setOpen(true);
        setState({
          ...state,
          extra_data: ''
        });
    }
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
        buyer_name: e
      });
    }
  };

  const handleTransfer = (e) => {
    setState({
      ...state,
      receiver: e.trim()
    });
  }

  const handleBuyer = (e) => {
    setState({
      ...state,
      buyer_name: e
    });
  }

  const componentDidMount = () => {
    bsCustomFileInput.init();
  };
  useEffect(() => {
    componentDidMount();
  }, []);

  if (redirect) {
    return <Redirect to='/' />;
  }

  return (
    <div>
      <div className='page-header'>
        <h3 className='page-title'>Input Sales</h3>
        <nav aria-label='breadcrumb'>
          <ol className='breadcrumb'>
            <li className='breadcrumb-item'>
              <a
                style={{ textDecoration: 'none' }}
                href='/'
                onClick={(event) => {
                  event.preventDefault();
                  setRedirect(true);
                }}
              >
                Home
              </a>
            </li>
            <li className='breadcrumb-item active' aria-current='page'>
              Input Sales
            </li>
          </ol>
        </nav>
      </div>
      <div className='col-xl grid-margin stretch-card'>
        <div className='card'>
          <div className='card-body'>
            <h4 className='card-title'>Input Sale</h4>
            <p className='card-description'> Enter sales made </p>
            <form className='forms-sample'>
              <label htmlFor='date'>Date</label>
              <Form.Group>
                <DatePicker
                  selected={state.date}
                  onChange={handleDate}
                  className="form-control text-white"
                  id='date'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='buyer_name'>Buyer Name</label>
                <DropdownButton
                    alignRight
                    title={state.buyer_name || 'Choose Buyer Name'}
                    id='buyer_name'
                    onSelect={handleBuyer}
                >
                  {Array(...buyer_names).sort().map(x => {
                    return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                  })}
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='tray_no'>Number of Trays</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  value={state.tray_no}
                  className="form-control text-white"
                  id='tray_no'
                  placeholder='Number of Trays'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='tray_price'>Price per Tray</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  className="form-control text-white"
                  id='tray_price'
                  placeholder='Price per Tray'
                  value={state.tray_price}
                />
              </Form.Group>
              <Form.Group>
                <div className='form-check'>
                  <label htmlFor='1' className='form-check-label'>
                    <input
                      type='radio'
                      onChange={handleSelect}
                      className='form-check-input'
                      name='status'
                      id='paid'
                      defaultChecked
                      defaultValue={0}
                    />
                    <i className='input-helper' />
                    Paid
                  </label>
                </div>
                <div className='form-check'>
                  <label htmlFor='0' className='form-check-label'>
                    <input
                      type='radio'
                      onChange={handleSelect}
                      className='form-check-input'
                      name='status'
                      id='not_paid'
                      defaultValue={0}
                    />
                    <i className='input-helper' />
                    Not Paid
                  </label>
                </div>
              </Form.Group>
              <Form.Group>
                <label htmlFor='receiver'>Money transferred to</label>
                <DropdownButton
                    alignRight
                    title={state.receiver}
                    id='receiver'
                    onSelect={handleTransfer}
                >
                  <Dropdown.Item eventKey="Victor">Victor</Dropdown.Item>
                  <Dropdown.Item eventKey="Anne">Anne</Dropdown.Item>
                  <Dropdown.Item eventKey="Jeff">Jeff</Dropdown.Item>
                  <Dropdown.Item eventKey="Babra">Babra</Dropdown.Item>
                  <Dropdown.Item eventKey="Purity">Purity</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="Bank">Bank</Dropdown.Item>
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor="extra_data">Extra info (optional)</label>
                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="extra_data" placeholder="Any extra information" />
              </Form.Group>
              <button
                type='submit'
                className='btn btn-primary mr-2'
                onClick={handleSubmit}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
      <Online>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='success'>
            Data Submitted
          </Alert>
        </Snackbar>
      </Online>
      <Offline>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='warning'>
            Data will be submitted automatically when back online
          </Alert>
        </Snackbar>
      </Offline>
      <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity='error'>{error}</Alert>
      </Snackbar>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => {
  return {
    inputSell: sale => dispatch(inputSell(sale))
  };
};

const mapStateToProps = function(state) {
  return {
    extraData: state.firestore.ordered.extra_data
  }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
      {
        collection: 'farms',
        doc: '0',
        subcollections: [
            {collection: 'extra_data', doc: 'extra_data'}
        ],
        storeAs: 'extra_data'
      }
    ])
)(InputSell);
