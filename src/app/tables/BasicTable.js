import React from 'react'
import EnhancedTable from "./Table";

function BasicTable() {
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
        <EnhancedTable />
      </div>
    )
}

export default BasicTable;

