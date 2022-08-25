import React, {useEffect, useState} from 'react'
import EnhancedTable from "./Table";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Form } from 'react-bootstrap';
import numeral from "numeral";
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";

function BasicTable({ pse_state, sales_state }) {
    const [hash, setHash] = useState('');
    const [state, setState] = useState('');
    const [isSale, setIsSale] = useState('');
    const [value, setValue] = useState(0);
    const [saleState, setSaleState] = useState({});
    const [pseState, setPseState] = useState({});

    useEffect(() => {
        if (pse_state) setPseState(pse_state.state);
        if (sales_state) setSaleState(sales_state.state);
    }, [pse_state, sales_state]);

    useEffect(() => {
        const saleOptions = [
            'Thika Farmers',
            'Cakes',
            'Duka',
            'Other Sales'
        ];
        const pseOptions = [
            'Feeds',
            'Pay Purity',
            'Other Purchases'
        ];
        let tempState = '';
        if (state === 'Sales' || saleOptions.includes(state)) {
            setIsSale('true');
            tempState = 'true';
        } else if (state === 'Purchases' || pseOptions.includes(state)) {
            setIsSale('false');
            tempState = 'false';
        } else {
            setIsSale('');
        }
        if (tempState === 'true' && sales_state) {
            if (state === 'Thika Farmers') setValue(sales_state.state.total_earned_thikafarmers);
            else if (state === 'Cakes') setValue(sales_state.state.total_earned_cakes);
            else if (state === 'Duka') setValue(sales_state.state.total_earned_duka);
            else if (state === 'Other Sales') setValue(sales_state.state.total_earned_other);
            else setValue(sales_state.state.total_earned);
        } else if (tempState === 'false' && pse_state) {
            if (state === 'Feeds') setValue(pse_state.state.total_spent_feeds);
            else if (state === 'Pay Purity') setValue(pse_state.state.total_spent_ppurity);
            else if (state === 'Other Purchases') setValue(pse_state.state.total_spent_other);
            else setValue(pse_state.state.total_spent);
        } else setValue(0);

        // eslint-disable-next-line
    }, [state, saleState, pseState]);

    const handleSelect = (val) => {
        if (val === 'None') setState('');
        else setState(val);
    }

    const handleHashChange = (e) => {
        const cleanedHash = e.target.value.replace(/\s+/g, '').replace(/(\r\n|\n|\r)/gm, '');
        setHash(cleanedHash);
    }

    return (
      <div>
          <div className="page-header">
              <h3 className="page-title">All Entries</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => event.preventDefault()}>Tables</a></li>
                  <li className="breadcrumb-item active" aria-current="page">All Entries</li>
                </ol>
              </nav>
          </div>
          <div className="row">
          <div className='col-xl grid-margin stretch-card'>
              <div className='card'>
                  <div className='card-body'>
                      <h4 className='card-title'>Sort by</h4>
                      <form className='forms-sample'>
                          <Form.Group>
                              <label htmlFor='section'>Options</label>
                              <DropdownButton
                                  alignRight
                                  title={state || 'Choose sort option'}
                                  id='dropdown-menu-align-right'
                                  onSelect={handleSelect}
                              >
                                  {optionsSort.map(item => {
                                      return item.label === 'Feeds' ? (
                                          <div>
                                              <Dropdown.Divider />
                                              <Dropdown.Item eventKey={item.label}>{item.label}</Dropdown.Item>
                                          </div>
                                      ) : <Dropdown.Item eventKey={item.label}>{item.label}</Dropdown.Item>
                                  })}
                              </DropdownButton>
                          </Form.Group>
                          <Form.Group>
                              <label htmlFor='hash'>Input specific id (64 digit code)</label>
                              <Form.Control
                                  type='text'
                                  onChange={handleHashChange}
                                  className='form-control'
                                  id='hash'
                                  placeholder='Input id'
                                  value={hash}
                              />
                          </Form.Group>
                      </form>
                  </div>
              </div>
          </div>
          { isSale !== '' &&
              <div className="col-md-4 grid-margin stretch-card">
                  <div className="card">
                      <div className="card-body">
                          <h5>Total {isSale === 'true' ? 'Earned from' : 'Spent on'} {state}</h5>
                          <div className="row">
                              <div className="col-8 col-sm-12 col-xl-8 my-auto">
                                  <div className="d-flex d-sm-block d-md-flex align-items-center">
                                      <h2 className="mb-0">Ksh. {Number.isInteger(value) ? numeral(value).format("0,0") : numeral(value).format("0,0.00")}</h2>
                                      <p className="text-success ml-2 mb-0 font-weight-medium">+0.0%</p>
                                  </div>
                              </div>
                              <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                                  <i className="icon-lg mdi mdi-codepen text-primary ml-auto"/>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          }
          </div>
            <EnhancedTable to_use={state} hash={hash} />
      </div>
    )
}
const optionsSort = [
    { label: 'None'},
    { label: 'Sales' },
    { label: 'Purchases'},
    { label: 'Eggs Collected' },
    { label: 'Trades'},
    { label: 'Dead or Sick'},
    { label: 'Feeds' },
    { label: 'Pay Purity' },
    { label: 'Thika Farmers' },
    { label: 'Cakes' },
    { label: 'Duka' },
    { label: 'Other Sales' },
    { label: 'Other Purchases'},
    { label: 'Submitted by Victor'},
    { label: 'Submitted by Purity'},
    { label: 'Submitted by Babra'},
    { label: 'Submitted by Jeff'},
];

const mapStateToProps = (state) => {
    return {
        sales_state: state.firestore.data.sales,
        pse_state: state.firestore.data.purchases
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        { collection: 'sales', doc: 'state'},
        { collection: 'purchases', doc: 'state'}
    ])
)(BasicTable);

