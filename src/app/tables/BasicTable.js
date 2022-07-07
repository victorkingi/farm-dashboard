import React, { useState } from 'react'
import EnhancedTable from "./Table";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Form } from 'react-bootstrap';

function BasicTable() {
    const [hash, setHash] = useState('');
    const [state, setState] = useState('');

    const handleSelect = (val) => {
        if (val === 'None') setState('');
        else setState(val);
    }

    const handleHashChange = (e) => {
        setHash(e.target.value);
    }

    return (
      <div>
          <div className="page-header">
              <h3 className="page-title">All Entries</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="!#" onClick={event => event.preventDefault()}>Tables</a></li>
                  <li className="breadcrumb-item active" aria-current="page">All Entries</li>
                </ol>
              </nav>
          </div>
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
                              <label htmlFor='hash'>Input specific id (5 digit code)</label>
                              <Form.Control
                                  type='text'
                                  onChange={handleHashChange}
                                  className='form-control'
                                  id='hash'
                                  placeholder='Hash'
                                  value={hash}
                              />
                          </Form.Group>
                      </form>
                  </div>
              </div>
          </div>
          <div className="row">
            <EnhancedTable to_use={state} hash={hash} />
          </div>
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

export default BasicTable
