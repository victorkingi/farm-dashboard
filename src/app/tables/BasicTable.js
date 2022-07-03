import React, {useState} from 'react'
import EnhancedTable from "./Table";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

function BasicTable() {
    const [label, setLabel] = useState('');
    const [hash, setHash] = useState('');

    const handleChange = (event, values) => {
        setLabel(values.label);
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
        <div className="row">
            <div className="col-lg-6 grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <Autocomplete
                            disablePortal
                            id="combo-box-demo"
                            options={top100Films}
                            sx={{ width: 300 }}
                            onChange={handleChange}
                            renderInput={(params) => <TextField {...params} label="Select Type to Show" color="success" focused />}
                        />
                        <br />
                        <TextField value={hash} onChange={handleHashChange} fullWidth id="outlined-basic" label="Enter specific hash to check" variant="outlined" />
                    </div>
                </div>
            </div>
          <EnhancedTable to_use={label} hash={hash} />
        </div>
      </div>
    )
}
const top100Films = [
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
    { label: 'Other Purchases'}
];

export default BasicTable
