import React, { Component } from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'

//df
export class InputSell extends Component {
  state = {
    startDate: new Date(),
    section: 'Choose Section',
    category: 'sale'
  };
 
  handleChange = date => {
    this.setState({
      startDate: date
    });
  };

  handleSelect = (e) => {
    console.log(e);
    if (e.target) {
      this.setState({
        ...this.state,
        [e.target.id]: e.target.value
      });
    } else {
      this.setState({
        ...this.state,
        section: e
      });
    }
  }

  componentDidMount() {
    bsCustomFileInput.init()
  }

  render() {
    console.log(this.state)
    return (
      <div>
        <div className="page-header">
          <h3 className="page-title">Input Sales</h3>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="!#" onClick={event => event.preventDefault()}>Input Pages</a></li>
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
                  <DropdownButton
                      alignRight
                      title={this.state.section}
                      id="dropdown-menu-align-right"
                      onSelect={this.handleSelect}
                  >
                    <Dropdown.Item eventKey="Thika Farmers">Thika Farmers</Dropdown.Item>
                    <Dropdown.Item eventKey="Cakes">Cakes</Dropdown.Item>
                    <Dropdown.Item eventKey="Duka">Duka</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item eventKey="Other">Other</Dropdown.Item>
                  </DropdownButton>
                  <br />
                  <Form.Group>
                    <label htmlFor="buyerName">Buyer Name</label>
                    <Form.Control type="text"
                                  onChange={this.handleSelect}
                                  className="form-control" id="buyerName" placeholder="Name of Buyer" />
                  </Form.Group>
                  <Form.Group>
                    <label htmlFor="trayNo">Number of Trays</label>
                    <Form.Control type="number" onChange={this.handleSelect} className="form-control" id="trayNo" placeholder="Number of Trays" />
                  </Form.Group>
                  <Form.Group>
                    <label htmlFor="trayPrice">Price per Tray</label>
                    <Form.Control type="number" onChange={this.handleSelect} className="form-control" id="trayPrice" placeholder="Price per Tray" />
                  </Form.Group>
                  <div className="col-md-6">
                    <Form.Group>
                      <div className="form-check">
                        <label className="form-check-label">
                          <input type="radio" onChange={this.handleSelect} className="form-check-input" name="paid" id="paid" value="1" defaultChecked/>
                          <i className="input-helper"/>
                          Paid
                        </label>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="form-check">
                    <label className="form-check-label text-muted">
                      <input type="checkbox" onChange={this.handleSelect} className="form-check-input"/>
                      <i className="input-helper"></i>
                      Replace wrong entry
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary mr-2">Submit</button>
                </form>
              </div>
            </div>
          </div>
      </div>
    )
  }
}

export default InputSell
