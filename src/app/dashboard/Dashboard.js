import React, {useEffect, useMemo, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import numeral from 'numeral';
import moment from 'moment';
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from '../form-elements/InputEggs';
import {sanitize_string} from "../../services/actions/utilAction";
import {Redirect} from "react-router-dom";
import {Offline, Online} from "react-detect-offline";
import CountUp from 'react-countup';

export function getRanColor() {
  const ranR = Math.floor((Math.random()*255)+1).toString(16);
  const ranG = Math.floor((Math.random()*255)+1).toString(16);
  const ranB = Math.floor((Math.random()*255)+1).toString(16);
  return ("#"+ranR+ranG+ranB).length === 6 ? "#0"+ranR+ranG+ranB : "#"+ranR+ranG+ranB;
}

function Dashboard(props) {
  const { dashboard, pend, firestore, pendEggs } = props;

  const [dash, setDash] = useState({});
  const [open, setOpen] = useState(false);
  const [done1, setDone1] = useState(false);
  const [error, setError] = useState(false);
  const [errM, setErrM] = useState('');
  const [disable, setDisable] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [pendChecked, setPendChecked] = useState({});
  const [allCheckedEggs, setAllCheckedEggs] = useState(false);
  const [pendCheckedEggs, setPendCheckedEggs] = useState({});
  const [disableEggs, setDisableEggs] = useState(false);

  let __user__ = localStorage.getItem('name');
  __user__ = __user__ !== null ? __user__.toUpperCase() : '';

  useEffect(() => {
    if (dashboard) {
      setDash(dashboard[0]);
    }
  }, [dashboard]);

  useEffect(() => {
    let total = 0;
    for (const [, value] of Object.entries(pendChecked)) {
      if (value) total += 1;
    }
    if (total === pend?.length && total !== 0) setAllChecked(true);
    else setAllChecked(false);
  }, [pendChecked, pend])

  useEffect(() => {
        let total = 0;
        for (const [, value] of Object.entries(pendCheckedEggs)) {
            if (value) total += 1;
        }
        if (total === pendEggs?.length && total !== 0) setAllCheckedEggs(true);
        else setAllCheckedEggs(false);
  }, [pendCheckedEggs, pendEggs])

  useEffect(() => {
      if (pendEggs) {
        if (pendEggs.length > 0) {
            let allDisable  = false;
            for (let k = 0; k < pendEggs.length; k++) {
                if (pendEggs[k].values.submitted_by !== __user__) {
                    allDisable = true;
                    break;
                }
            }
            setDisableEggs(allDisable);
        }
    }

    }, [pendEggs, __user__]);

  useEffect(() => {
      if (pend?.length > 0) {
        let allDisable  = false;
        for (let k = 0; k < pend.length; k++) {
            if (!(pend[k].values?.name === __user__ || pend[k].values?.submitted_by === __user__)) {
                allDisable = true;
                break;
            }
        }
        setDisable(allDisable);
      }

  }, [pend, __user__]);

  // undo write events to database
  const rollBack = () => {
      for (const [key, value] of Object.entries(pendCheckedEggs)) {
          if (value) {
              firestore.collection("pend_eggs_collected").doc(key).delete();
              setError(false);
              setOpen(true);
              setAllCheckedEggs(false);
          }
      }
      for (const [key, value] of Object.entries(pendChecked)) {
          if (value) {
              firestore.collection("pending_transactions").doc(key).delete();
              setError(false);
              setOpen(true);
              setAllChecked(false);
          }
      }

  }

  const user = useMemo(() => {
    const __user = localStorage.getItem('user') || false;

    return {__user};
  }, []);

  if (!user.__user) {
    return (
        <Redirect to="/user-pages/login-1"/>
    )
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setError(false);
    setErrM('');
    setOpen(false);
  };

  const getAmount = (item) => {
     if (item.tray_no)
       return parseInt(item.tray_no)
           * parseInt(item.tray_price);
     else if (item.item_no)
       return  parseInt(item.item_no)
           * parseInt(item.item_price);
     else if (item.amount) return item.amount;
   }

  const display = (e) => {
     e.preventDefault();
     const submit = document.getElementById(`rewind`);
     submit.disabled = true;
     rollBack();
   }

  if (JSON.stringify(dash) !== JSON.stringify({})) {

   const addAllEntries = (all) => {
      if (!pend) return 0;
      const allPend = {};
      for (let i = 0; i < pend.length; i++) {
        if (pend[i].id === 'cleared') continue;
        allPend[pend[i].id] = all;
      }
      setPendChecked(allPend);
   }

   const cleanAddress = (str) => {
       if (typeof str !== 'string') return '';
       str = str.toLowerCase();
       str = str.split('_');
       if (str.length === 1) return str[0].charAt(0).toUpperCase()+str[0].slice(1);
       str = str.join(' ');
       return str.charAt(0).toUpperCase()+str.slice(1);
   }

  const addAllEntriesEggs = (all) => {
      if (!pendEggs) return 0;
      const allPend = {};
      for (let i = 0; i < pendEggs.length; i++) {
          allPend[pendEggs[i].id] = all;
      }
      setPendCheckedEggs(allPend);
  }

  const callFunc = (e) => {
       e.preventDefault();
       window.alert("Calling write function...");
       const run = document.getElementById('run');
       run.disabled = true;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      const raw = JSON.stringify({});
      const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
      };

      fetch("https://us-central1-poultry101-f1fa0.cloudfunctions.net/write-entries", requestOptions)
          .then(response => response.text())
          .then(result => {
              console.log(result);
              window.alert("Success call");
          })
          .catch(error => {
              console.log('error', error)
              window.alert("Error", error);
          });
  }

  if (!dash.id) {
      return <div />
  }

   return (
       <div>
         <div className="row">
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">{!done1 &&
                                         <CountUp
                                             start={Math.abs(Object.values(dash.laying_day['0'])[0]-10)}
                                             end={Object.values(dash.laying_day['0'])[0]}
                                             duration={2.75}
                                             delay={1}
                                             onEnd={() => setDone1(true)}
                                         />}{done1 && numeral(Object.values(dash.laying_day['0'])[0]).format("0,0")}%</h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>

                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-success`}>
                      <span
                          className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Flock 1 Lay Percent Day ({moment(Object.keys(dash.laying_day['0'])[0]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">{!done1 &&
                                         <CountUp
                                             start={Math.abs(Object.values(dash.laying_day['1'])[0]-10)}
                                             end={Object.values(dash.laying_day['1'])[0]}
                                             duration={2.75}
                                             delay={1}
                                             onEnd={() => setDone1(true)}
                                         />}{done1 && numeral(Object.values(dash.laying_day['1'])[0]).format("0,0")}%</h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>

                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-success`}>
                      <span
                          className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Flock 2 Lay Percent Day ({moment(Object.keys(dash.laying_day['1'])[0]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">{numeral(dash.bird_no.total).format("0,0")}</h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>
                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-success`}>
                      <span
                          className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Total Birds</h6>
                     </div>
                 </div>
             </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">
                                         {Object.values(dash.feeds_left['0'])[0]}
                                     </h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>
                             </div>
                             <div className="col-3">
                                 <div className={`icon icon-box-success`}>
                                     <span className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Flock 1 Feeds in Store <br /> ({moment(Object.keys(dash.feeds_left['0'])[0]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">
                                         {Object.values(dash.feeds_left['1'])[0]}
                                     </h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>
                             </div>
                             <div className="col-3">
                                 <div className={`icon icon-box-success`}>
                                     <span className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Flock 2 Feeds in Store <br /> ({moment(Object.keys(dash.feeds_left['1'])[0]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">
                                        {dash.trays_left['value']}</h3>
                                     <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                                         {'+'.concat(numeral().format("0,0.0"))}%
                                     </p>
                                 </div>

                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-success`}>
                      <span
                          className={`mdi mdi-arrow-top-right icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Trays in Store ({moment(dash.trays_left['date']['unix']*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
         </div>
         <div className="row">
             <div className="col-12 grid-margin">
             <div className="card">
               <div className="card-body">
                 <h4 className="card-title">Pending Transactions</h4>
                   { pendEggs && pendEggs?.length !== 0 &&
                       <div className="table-responsive">
                           <table className="table">
                           <thead>
                           <tr className="text-white">
                               <th>
                                   <div className="form-check form-check-muted m-0">
                                       <label className="form-check-label">
                                           <input
                                               disabled={disableEggs}
                                               type="checkbox"
                                               className="form-check-input"
                                               defaultValue={0}
                                               onChange={() => {
                                                   setAllCheckedEggs(!allCheckedEggs);
                                                   addAllEntriesEggs(!allCheckedEggs);
                                               }}
                                               checked={allCheckedEggs}
                                               id="pendingEggs"
                                               name="pendingEggs"
                                           />
                                           <i className="input-helper"/>
                                       </label>
                                   </div>
                               </th>
                               <th> Status</th>
                               <th> Date</th>
                               <th> Trays</th>
                               <th> Bags</th>
                               <th> Eggs</th>
                               <th> Broken</th>
                               <th> By</th>
                           </tr>
                           </thead>
                           <tbody>
                           {pendEggs && pendEggs.map((item) => {
                               const item_vals = item.values;
                               let disCheckBox = __user__ !== item_vals.submitted_by;
                               return (
                                   <tr key={item.id} className={`text-${(item.hasOwnProperty('rejected') && item.hasOwnProperty('ready') && item.rejected !== item.ready) ? 'white' : 'muted'}`}>
                                       <td>
                                           <div className="form-check form-check-muted m-0">
                                               <label className="form-check-label">
                                                   <input disabled={disCheckBox} type="checkbox"
                                                          className="form-check-input" defaultValue={0}
                                                          checked={pendCheckedEggs[item.id]}
                                                          onChange={() => setPendCheckedEggs({
                                                              ...pendCheckedEggs,
                                                              [item.id]: !pendCheckedEggs[item.id]
                                                          })}
                                                          id={item.id} name={item.id}
                                                   />
                                                   <i className="input-helper"/>
                                               </label>
                                           </div>
                                       </td>
                                       <td>
                                           {(item?.rejected === true && item?.signal !== 1)
                                               ? <div className="badge badge-outline-danger">Rejected</div>
                                               : (item?.rejected === true && item?.signal === 1)
                                                   ? <div className="badge badge-outline-light">Rejected</div>
                                                   : item?.ready === true ? <div className="badge badge-outline-success">Ready</div>
                                                       : ((item?.ready === item?.rejected) && item?.ready === false ? <div className="badge badge-outline-info">Failed</div>
                                                           : <div className="badge badge-outline-primary">Waiting</div>)}
                                       </td>
                                       <td> {moment(item_vals.date.toDate()).format("MMM Do YY")} </td>
                                       <td> flock: {parseInt(item_vals.subgroups?.split('::')[0])+1 || parseInt(item_vals.group?.split('::')[0])+1}, trays: ({item_vals.trays_store}) </td>
                                       <td> {item_vals.extra_data.split(';')[2]} </td>
                                       <td> {item_vals.eggs.slice(0, item_vals.eggs.length-1)} </td>
                                       <td> {item_vals.broken} </td>
                                       <td> {item_vals.submitted_by.charAt(0) + item_vals.submitted_by.slice(1).toLowerCase()} </td>
                                   </tr>
                               )
                           })}
                           </tbody>
                       </table>
                       </div>
                   }
                   <div className="table-responsive">
                   <table className="table">
                     <thead>
                     <tr className="text-white">
                         <th>
                             <div className="form-check form-check-muted m-0">
                               <label className="form-check-label">
                                 <input
                                     disabled={disable}
                                     type="checkbox"
                                     className="form-check-input"
                                     defaultValue={0}
                                     onClick={() => {
                                       setAllChecked(!allChecked);
                                       addAllEntries(!allChecked);
                                     }}
                                     checked={allChecked}
                                     id="pending"
                                     name="pending"
                                 />
                                 <i className="input-helper"/>
                               </label>
                             </div>
                         </th>
                         <th> Status </th>
                         <th> Date </th>
                         <th> Name </th>
                         <th> From </th>
                         <th> To </th>
                         <th> Amount </th>
                     </tr>
                     </thead>
                     <tbody>
                     {pend && pend.map((item) => {
                         let disCheckBox = __user__ !== item.values?.name;
                         disCheckBox = disCheckBox && "ANNE" !== item.values?.name;
                         disCheckBox = disCheckBox && "BANK" !== item.values?.name;
                         const item_vals = item.values;

                         if (item_vals.category === 'dead_sick') {
                             disCheckBox = __user__ !== item_vals.submitted_by;
                             return (
                                 <tr key={item.id} className={`text-${(item.hasOwnProperty('rejected') && item.hasOwnProperty('ready') && item.rejected !== item.ready) ? 'white' : 'muted'}`}>
                                     <td>
                                         <div className="form-check form-check-muted m-0">
                                             <label className="form-check-label">
                                                 <input disabled={disCheckBox} type="checkbox"
                                                        className="form-check-input" defaultValue={0}
                                                        checked={pendChecked[item.id]}
                                                        onChange={() => setPendChecked({...pendChecked,
                                                            [item.id]: !pendChecked[item.id]})}
                                                        id={item.id} name={item.id}
                                                 />
                                                 <i className="input-helper"/>
                                             </label>
                                         </div>
                                     </td>
                                     <td>
                                         {(item?.rejected === true && item?.signal !== 1)
                                             ? <div className="badge badge-outline-danger">Rejected</div>
                                             : (item?.rejected === true && item?.signal === 1)
                                                 ? <div className="badge badge-outline-light">Rejected</div>
                                                 : item?.ready === true ? <div className="badge badge-outline-success">Ready</div>
                                                     : ((item?.ready === item?.rejected) && item?.ready === false ? <div className="badge badge-outline-info">Failed</div>
                                                         : <div className="badge badge-outline-primary">Waiting</div>)}
                                     </td>
                                     <td> {moment(item_vals?.date?.toDate() || item_vals?.submitted_on?.toDate()).format("MMM Do YY")} </td>
                                     <td>{item_vals.section} Chicken(s)</td>
                                     <td>N/A</td>
                                     <td>N/A</td>
                                     <td>N/A</td>
                                 </tr>
                             )
                         }

                         return (
                           <tr key={item.id} className={`text-${(item.hasOwnProperty('rejected') && item.hasOwnProperty('ready') && item.rejected !== item.ready) ? 'white' : 'muted'}`}>
                               <td>
                               <div className={`form-check form-check-muted m-0`}>
                                 <label className="form-check-label">
                                   <input disabled={disCheckBox} type="checkbox"
                                          className="form-check-input" defaultValue={0}
                                          checked={pendChecked[item.id]}
                                          onChange={() => setPendChecked({...pendChecked,
                                            [item.id]: !pendChecked[item.id]})}
                                          id={item.id} name={item.id}
                                   />
                                   <i className="input-helper"/>
                                 </label>
                               </div>
                             </td>
                               <td>
                                   {(item?.rejected === true && item?.signal !== 1)
                                       ? <div className="badge badge-outline-danger">Rejected</div>
                                       : (item?.rejected === true && item?.signal === 1)
                                           ? <div className="badge badge-outline-light">Rejected</div>
                                           : item?.ready === true ? <div className="badge badge-outline-success">Ready</div>
                                               : ((item?.ready === item?.rejected) && item?.ready === false ? <div className="badge badge-outline-info">Failed</div>
                                                   : <div className="badge badge-outline-primary">Waiting</div>)}
                               </td>
                               <td> {moment(item_vals?.date?.toDate() || item_vals?.submitted_on?.toDate()).format("MMM Do YY")} </td>
                               <td> {item_vals?.reason === "WITHDRAW" ? "Withdrawal" : sanitize_string(item_vals)} </td>
                               <td>{['purchases', 'sales'].includes(item_vals?.category) ? 'N/A' : (item_vals?.name !== 'BLACK_HOLE' ? cleanAddress(item_vals?.name) : 'N/A')}</td>
                               <td>{(item_vals?.receiver === 'BLACK_HOLE' ? 'N/A' : (item_vals?.receiver
                               && item_vals?.reason !== "WITHDRAW" ? (item_vals?.receiver
                                   && item_vals?.receiver.charAt(0)+item_vals?.receiver.slice(1).toLowerCase())
                                   : item_vals?.reason === "WITHDRAW" ? (item_vals?.initiator
                                       && item_vals?.initiator.charAt(0)+item_vals?.initiator.slice(1).toLowerCase())
                                       : (item_vals?.name && item_vals?.name.charAt(0)+item_vals?.name.slice(1).toLowerCase())))}</td>
                               <td> {numeral(parseInt(getAmount(item_vals))).format("0,0")} </td>
                           </tr>
                         )
                     })}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </div>
             <div style={{display: 'flex'}}>
                 <div style={{paddingRight: '30%'}}>
                    <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='rewind'>
                        Rewind
                    </button>
                 </div>
                 <div>
                     {__user__ === 'VICTOR' &&
                         <button type="button" disabled={false} className="btn btn-primary" onClick={callFunc} id='run'>
                             Run
                         </button>
                     }
                 </div>
             </div>
             <Online>
                 <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                   <Alert onClose={handleClose} severity="success">
                     Accepted. Rewinded entries
                   </Alert>
                 </Snackbar>
             </Online>
             <Offline>
                   <Snackbar
                       open={open} autoHideDuration={5000}
                       onClose={handleClose}
                       key={'topcenter'}>
                       <Alert onClose={handleClose} severity="warning">
                           Accepted. Rewinding will happen when back online
                       </Alert>
                   </Snackbar>
             </Offline>
             <Snackbar
                 open={error} autoHideDuration={5000}
                 onClose={handleClose}>
                 <Alert onClose={handleClose} severity="error">
                     {errM}
                 </Alert>
             </Snackbar>
         </div>
       </div>
   );
 } else {
    return <div />
  }
}

const mapStateToProps = function(state) {
  return {
      dashboard: state.firestore.ordered.dashboard_data,
      acc: state.firestore.ordered.accounts,
      pend: state.firestore.ordered.pending_transactions,
      lateDuka: state.firestore.ordered.late_payment,
      pendEggs: state.firestore.ordered.pend_eggs_collected
  }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data', doc: 'dashboard'},
        {collection: 'accounts', doc: 'accounts'},
        {collection: 'late_payment', where: ['values.buyer_name', '==', 'DUKA']},
        {collection: 'pending_transactions', orderBy: ['values.date', 'asc']},
        {collection: 'pend_eggs_collected', orderBy: ['values.date', 'asc']}
    ])
)(Dashboard);
