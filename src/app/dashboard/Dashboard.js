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
import {firestore} from "../../services/api/fbConfig";

export function getRanColor() {
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  return "#"+randomColor;
}

function Dashboard(props) {
  const { dashboard, pend } = props;

  const [dash, setDash] = useState({});
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done3, setDone3] = useState(false);
  const [done4, setDone4] = useState(false);
  const [error, setError] = useState(false);
  const [errM, setErrM] = useState('');
  const [disable, setDisable] = useState(false);
  const [name, setName] = useState('');
  const [allChecked, setAllChecked] = useState(false);
  const [pendChecked, setPendChecked] = useState({});
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
    if (total === pend?.length - 1 && total !== 0) setAllChecked(true);
    else setAllChecked(false);
  }, [pendChecked, pend]);

  useEffect(() => {
    setName(__user__);
    if (pend) {
      if (pend.length > 0) {
        let allDisable  = false;
        for (let k = 0; k < pend.length; k++) {
          //if we come across the first one where name isn't name break loop
          if (pend[k].id === 'cleared') continue;
          if (pend[k].values?.name) {
            if (pend[k].values?.name !== name
                && pend[k].values?.name !== "ANNE") {
              allDisable = true;
              break;
            }
          }
          if (pend[k].values?.from) {
            if (pend[k].values?.from !== name) {
              allDisable = true;
              break;
            }
          }
        }
        setDisable(allDisable);
      }
    }
  }, [name, pend, __user__]);

  // undo write events to database
  const rollBack = () => {
    for (const [key, value] of Object.entries(pendChecked)) {
      if (value) {
        firestore.collection("pending_transactions").doc(key)
            .get().then(async (doc) => {
          if (doc.exists) {
            await doc.ref.delete();
          } else {
            const err = new Error("Invalid data!");
            setOpen(false);
            setErrM("The reference no longer exists, it probably didn't have a clean EXIT_DEL instruction");
            setError(true);
            throw err;
          }
        });
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
    setOpen(false);
  };

  const getAmount = (item) => {
     if (item?.values?.trayNo)
       return parseInt(item?.values?.trayNo)
           * parseFloat(item?.values?.trayPrice);
     else if (item?.values?.objectNo)
       return  parseInt(item?.values?.objectNo)
           * parseFloat(item?.values?.objectPrice);
     else if (item?.values?.amount) return item?.values?.amount;
   }

  const display = (e) => {
     e.preventDefault();
     const submit = document.getElementById(`rewind`);
     submit.disabled = true;
     rollBack();
     setOpen(true);
   }

  const isRejected = (date) => {
     if (date) {
       const today = new Date().getTime();
       let toMine = new Date(date);
       toMine.setHours(3, 0, 0, 0);
       // if mine time is < submittedOn then choose next date, else choose today
       if (toMine.getTime() < date.getTime()) {
         toMine.setDate(toMine.getDate()+1);
       }
       return toMine.getTime() < today;
     } else {
       return false;
     }
   }

  if (JSON.stringify(dash) !== JSON.stringify({})) {
   const name = localStorage.getItem('name').toUpperCase();
   const weeks = Object.keys(dash.week_profit);
   const months = Object.keys(dash.month_profit);

   const last_week = weeks.reduce(((previousValue, currentValue) => {
     const prev = parseInt(previousValue);
     const cur = parseInt(currentValue);
     if (prev < cur) return cur;
     else return prev;
   }));
   const last_month = months.reduce(((previousValue, currentValue) => {
     const prev = parseInt(previousValue);
     const cur = parseInt(currentValue);
     if (prev < cur) return cur;
     else return prev;
   }));
   const addAllEntries = (all) => {
      if (!pend) return 0;
      const allPend = {};
      for (let i = 0; i < pend.length; i++) {
        if (pend[i].id === 'cleared') continue;
        allPend[pend[i].id] = all;
      }
      setPendChecked(allPend);
   }

   const week_profit_change = dash.week_profit[last_week.toString()] - dash.week_profit[String(last_week-(7 * 24 * 60 * 60))];
   let week_profit_change_percent = (week_profit_change / dash.week_profit[String(last_week-(7 * 24 * 60 * 60))]) * 100;
   const month_profit_change = dash.month_profit[last_month.toString()] - dash.month_profit[String(last_month-(28 * 24 * 60 * 60))];
   let month_profit_change_percent = (month_profit_change / dash.month_profit[String(last_month-(28 * 24 * 60 * 60))]) * 100;
   month_profit_change_percent = isNaN(month_profit_change_percent) ? 100 : month_profit_change_percent;
   week_profit_change_percent = isNaN(week_profit_change_percent) ? 100 : week_profit_change_percent;

   return (
       <div>
         <div className="row">
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                 <div className="row">
                   <div className="col-9">
                     <div className="d-flex align-items-center align-self-start">
                       <h3 className="mb-0">Ksh {!done &&
                           <CountUp
                               start={Math.abs(dash.withdraw[name] - 1000)}
                               end={dash.withdraw[name]}
                               duration={2.75}
                               delay={1}
                               onEnd={() => setDone(true)}
                           />}{done && numeral(dash.withdraw[name]).format("0,0")}</h3>
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
                 <h6 className="text-muted font-weight-normal">Amount Available to Withdraw</h6>
               </div>
             </div>
           </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
               <div className="card">
                 <div className="card-body">
                       <div className="row">
                         <div className="col-9">
                           <div className="d-flex align-items-center align-self-start">
                             <h3 className="mb-0">Ksh {!done4 &&
                                 <CountUp
                                     start={Math.abs(dash.owe[name] - 1000)}
                                     end={dash.owe[name]}
                                     duration={2.75}
                                     delay={1}
                                     onEnd={() => setDone4(true)}
                                 />}{done4 && numeral(dash.owe[name]).format("0,0")}</h3>
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
                   <h6 className="text-muted font-weight-normal">Current Debt</h6>
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
                                   start={0}
                                   end={dash.laying.week['1']}
                                   duration={2.75}
                                   delay={1}
                                   onEnd={() => setDone1(true)}
                               />}{done1 && numeral(dash.laying.week['1']).format("0.00")}%</h3>
                           <p className={`text-${ dash.laying.week['0']
                           < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                             {dash.laying.week['0'] < 0
                                 ? numeral(dash.laying.week['0']).format("0,0.0")
                                 : '+'.concat(numeral(dash.laying.week['0']).format("0,0.0"))}%
                           </p>
                         </div>

                       </div>
                       <div className="col-3">
                         <div
                             className={`icon icon-box-${dash.laying.week['0'] < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${dash.laying.week['0'] < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                         </div>
                       </div>
                     </div>
                 <h6 className="text-muted font-weight-normal">Last Week Laying Percentage</h6>
               </div>
             </div>
           </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                     <div className="row">
                       <div className="col-9">
                         <div className="d-flex align-items-center align-self-start">
                           <h3 className="mb-0">Ksh {numeral(dash.bank).format("0,0.00")}</h3>
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
                 <h6 className="text-muted font-weight-normal">Bank Balance</h6>
               </div>
             </div>
           </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                     <div className="row">
                       <div className="col-9">
                         <div className="d-flex align-items-center align-self-start">
                           <h3 className="mb-0">Ksh {numeral(dash.owe['THIKAFARMERSDEBT']).format("0,0.00")}</h3>
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
                 <h6 className="text-muted font-weight-normal">Thika Farmers Debt</h6>
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
                             {!done3 && <CountUp
                                 start={0}
                                 end={parseInt(dash.trays_avail.split(',')[0])}
                                 duration={2.75}
                                 delay={1}
                                 onEnd={() => setDone3(true)}
                             />}{done3 && <div>
                             {dash.trays_avail}
                           </div>}
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
                     <h6 className="text-muted font-weight-normal">Trays and Eggs in Store</h6>
                   </div>
                 </div>
               </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                   <div className="card-body">
                     <div className="row">
                       <div className="col-9">
                         <div className="d-flex align-items-center align-self-start">
                           <h3 className="mb-0">KSh {numeral(dash.week_profit[last_week.toString()]).format("0,0.00")}</h3>
                           <p className={`text-${week_profit_change_percent
                           < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                             {week_profit_change_percent < 0
                                 ? numeral(week_profit_change_percent).format("0,0.0")
                                 : '+'.concat(numeral(week_profit_change_percent).format("0,0.0"))}%
                           </p>
                         </div>
                       </div>
                       <div className="col-3">
                         <div
                             className={`icon icon-box-${week_profit_change_percent < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${week_profit_change_percent < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                         </div>
                       </div>
                     </div>
                     <h6 className="text-muted font-weight-normal">Week Profit</h6>
                   </div>
                 </div>
               </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                 <div className="row">
                   <div className="col-9">
                     <div className="d-flex align-items-center align-self-start">
                       <h3 className="mb-0">KSh {numeral(dash.month_profit[last_month.toString()]).format("0,0.00")}</h3>
                       <p className={`text-${month_profit_change_percent
                       < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                         {month_profit_change_percent < 0
                             ? numeral(month_profit_change_percent).format("0,0.0")
                             : '+'.concat(numeral(month_profit_change_percent).format("0,0.0"))}%
                       </p>
                     </div>
                   </div>
                   <div className="col-3">
                     <div
                         className={`icon icon-box-${month_profit_change_percent < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${month_profit_change_percent < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                     </div>
                   </div>
                 </div>
                 <h6 className="text-muted font-weight-normal">Month Profit</h6>
               </div>
             </div>
           </div>
           <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                 <div className="row">
                   <div className="col-9">
                     <div className="d-flex align-items-center align-self-start">
                       <h3 className="mb-0">{numeral(dash.birds).format("0,0")}</h3>
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
                 <h6 className="text-muted font-weight-normal">Total Birds</h6>
               </div>
             </div>
           </div>
         </div>
         <div className="row ">
           <div className="col-12 grid-margin">
             <div className="card">
               <div className="card-body">
                 <h4 className="card-title">Pending Transactions</h4>
                 <div className="table-responsive">
                   <table className="table">
                     <thead>
                     <tr>
                       <th>
                         <div className="form-check form-check-muted m-0">
                           <label className="form-check-label">
                             <input
                                 disabled={disable}
                                 type="checkbox"
                                 className="form-check-input"
                                 defaultValue={0}
                                 onChange={() => {
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
                       <th> Transaction State </th>
                       <th> From </th>
                       <th> To </th>
                       <th> Amount </th>
                       <th> Category </th>
                       <th> Section </th>
                       <th> Date </th>
                     </tr>
                     </thead>
                     <tbody>
                     {pend && pend.map((item) => {
                       let disCheckBox = name !== (item.values?.name
                               || item.values?.from)
                           && item.values?.name !== "ANNE";
                       if (item.id === "cleared") return null;

                       return (
                           <tr key={item.id}>
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
                               {isRejected(item?.submittedOn?.toDate()) && !item?.rejected && <div className="badge badge-outline-danger">Rejected</div>}
                               {isRejected(item?.submittedOn?.toDate()) && item?.rejected && <div className="badge badge-outline-info">Rejected</div>}
                               {!isRejected(item?.submittedOn?.toDate()) && !item?.rejected && <div className="badge badge-outline-warning">Pending</div>}
                             </td>
                             <td>
                               <div className="d-flex">
                                  <span className="pl-2">
                                    {item.values.category !== "send" && item.values.category !== "borrow" && 'Miner'}
                                    {item.values.category === "send" && item?.values?.name && sanitize_string(item?.values?.name)}
                                    {item.values.category === "borrow" && sanitize_string(item?.values?.borrower)}
                                  </span>
                               </div>
                             </td>
                             <td>
                               {item.values.category !== "send" && item.values.category !== "buys" && item.values.category !== "borrow"
                                   && item.values.section !== "THIKA_FARMERS" && item.values.section !== "DUKA"
                                   && sanitize_string(item?.values?.name)}
                               {item.values.section === "THIKA_FARMERS" && "Thika Farmers"}
                               {item.values.section === "DUKA" && "Jeff Duka"}
                               {item.values.category === "send" && item?.values?.receiver && sanitize_string(item?.values?.receiver)}
                               {item.values.category === "borrow" && sanitize_string(item?.values?.get_from)}
                               {item.values.category === "buys" && sanitize_string(item?.values?.section)}
                             </td>
                             <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
                             <td> {sanitize_string(item.values?.category)} </td>
                             <td> {sanitize_string(item.values?.section || item.values?.category)} </td>
                             <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                           </tr>
                       )
                     })}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </div>
           <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='rewind'>
             Rewind
           </button>
           <Online>
             <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
               <Alert onClose={handleClose} severity="success">
                 Accepted. Pending Transactions will be rewinded
               </Alert>
             </Snackbar>
             <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
               <Alert onClose={handleClose} severity="danger">
                 {errM}
               </Alert>
             </Snackbar>
           </Online>
           <Offline>
             <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
               <Alert onClose={handleClose} severity="warning">
                 Accepted. Rewinding will happen when back online
               </Alert>
             </Snackbar>
           </Offline>
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
    pend: state.firestore.ordered.pending_transactions,
  }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
      {collection: 'dashboard_data'},
      {collection: 'pending_transactions' },
    ])
)(Dashboard);
