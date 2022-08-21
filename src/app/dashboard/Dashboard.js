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
import Localbase from "localbase";


export function getRanColor() {
  const ranR = Math.floor((Math.random()*255)+1).toString(16);
  const ranG = Math.floor((Math.random()*255)+1).toString(16);
  const ranB = Math.floor((Math.random()*255)+1).toString(16);
  return ("#"+ranR+ranG+ranB).length === 6 ? "#0"+ranR+ranG+ranB : "#"+ranR+ranG+ranB;
}

let isRun = false;
function Dashboard(props) {
  const { dashboard, pend, firebase, firestore, verify, pendEggs } = props;

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

  useMemo(() => {
      let isSubscribed = true;
      const db = new Localbase('ver_data');

      const writeToDb = async (db) => {
          console.log("Writing to DB...");
          const verDoc = await firestore.get({ collection: 'verification_data' });
          verDoc.docs.forEach((doc_) => {
              if (doc_.id !== 'verification') return;
              const data = doc_.data();
              const hashes = new Array(...data.hashes).sort();
              db.collection('hashes').delete().then(() => {
                  db.collection('hashes').add({id: 1, hashes, root: verify.root.root });
              }).catch(() => {
                  db.collection('hashes').add({id: 1, hashes, root: verify.root.root });
              });
          });
      }

      const updateHashes = async () => {
          const doc = await db.collection('hashes').doc({id: 1}).get();
          if (doc) {
              if (doc.root === verify.root.root) {
                  console.log("root hashes match no update needed");
                  return;
              }
              await writeToDb(db);
          } else {
              await writeToDb(db);
          }
      }
      if (isSubscribed && verify?.root && !isRun) {
          isRun = true;
          updateHashes();
      }

      return () => isSubscribed = false;

      //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verify]);

  useEffect(() => {
    let total = 0;
    for (const [, value] of Object.entries(pendChecked)) {
      if (value) total += 1;
    }
    if (total === pend?.length - 1 && total !== 0) setAllChecked(true);
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
      setName(__user__);
      if (pendEggs) {
        if (pendEggs.length > 0) {
            let allDisable  = false;
            for (let k = 0; k < pendEggs.length; k++) {
                if (pendEggs[k].submittedBy !== name) {
                    allDisable = true;
                    break;
                }
            }
            setDisableEggs(allDisable);
        }
    }

    }, [name, pendEggs, __user__]);

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
          if (pend[k].submittedBy !== name) {
              allDisable = true;
              break;
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
      for (const [key, value] of Object.entries(pendCheckedEggs)) {
          if (value) {
              firestore.collection("pend_eggs_collected").doc(key)
                  .get().then(async (doc) => {
                  if (doc.exists) {
                      await doc.ref.delete();
                      setError(false);
                      setOpen(true);
                      setAllCheckedEggs(false);
                  } else {
                      const err = new Error("Invalid data!");
                      setOpen(false);
                      setErrM("Entry no longer exists");
                      setError(true);
                      return err;
                  }
              });
          }
      }
      for (const [key, value] of Object.entries(pendChecked)) {
          if (value) {
              firestore.collection("pending_transactions").doc(key)
                .get().then(async (doc) => {
              if (doc.exists) {
                  const data = doc.data();
                  const category = data.category;
                  if (category === 'deadSick') {
                      // also delete image
                      const fileName = data.file_name;
                      const storage = firebase.storage();
                      const storageRef = storage.ref();
                      const imageRef = storageRef.child(`dead_sick/${fileName}`);
                      await imageRef.delete();
                      console.log(fileName, "deleted");
                  }
                  await doc.ref.delete();
                  setError(false);
                  setOpen(true);
                  setAllChecked(false);
              } else {
                const err = new Error("Invalid data!");
                setOpen(false);
                setErrM("Entry no longer exists");
                setError(true);
                return err;
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
    setError(false);
    setErrM('');
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

  const addAllEntriesEggs = (all) => {
      if (!pendEggs) return 0;
      const allPend = {};
      for (let i = 0; i < pendEggs.length; i++) {
          allPend[pendEggs[i].id] = all;
      }
      setPendCheckedEggs(allPend);
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
                   { pendEggs && pendEggs?.length !== 0 &&
                       <div className="table-responsive">
                           <table className="table">
                           <thead>
                           <tr>
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
                               <th> a1</th>
                               <th> a2</th>
                               <th> b1</th>
                               <th> b2</th>
                               <th> c1</th>
                               <th> c2</th>
                               <th> house</th>
                               <th> broken</th>
                               <th> by</th>
                           </tr>
                           </thead>
                           <tbody>
                           {pendEggs && pendEggs.map((item) => {
                               let disCheckBox = name !== item.submittedBy;

                               return (
                                   <tr key={item.id}>
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
                                           {isRejected(item?.submittedOn?.toDate()) &&
                                               <div className="badge badge-outline-danger">Rejected</div>}
                                           {!isRejected(item?.submittedOn?.toDate()) &&
                                               <div className="badge badge-outline-warning">Pending</div>}
                                       </td>
                                       <td> {moment(item.date_ * 1000).format("MMM Do YY")} </td>
                                       <td> {item.trays_store} </td>
                                       <td> {item.a1} </td>
                                       <td> {item.a2} </td>
                                       <td> {item.b1} </td>
                                       <td> {item.b2} </td>
                                       <td> {item.c1} </td>
                                       <td> {item.c2} </td>
                                       <td> {item.house} </td>
                                       <td> {item.broken} </td>
                                       <td> {item.submittedBy.charAt(0) + item.submittedBy.slice(1).toLowerCase()} </td>
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
                         let disCheckBox = name !== (item.values?.name
                                 || item.values?.from)
                             && item?.values?.name !== "ANNE";
                         if (item.id === "cleared") return null;
                         if (item.category === 'deadSick') {
                             disCheckBox = name !== item.submittedBy;
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
                                     <td> {moment(item?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                     <td>{item.section} Chicken(s)</td>
                                     <td>N/A</td>
                                     <td>N/A</td>
                                     <td>N/A</td>
                                 </tr>
                             )
                         }

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
                                   {(isRejected(item?.submittedOn?.toDate()) || item.weirdName) && !item?.rejected && <div className="badge badge-outline-danger">Rejected</div>}
                                   {isRejected(item?.submittedOn?.toDate()) && item?.rejected && <div className="badge badge-outline-info">Rejected</div>}
                                   {!isRejected(item?.submittedOn?.toDate()) && !item.weirdName && !item?.rejected && <div className="badge badge-outline-warning">Pending</div>}
                               </td>
                               <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                               <td> {sanitize_string(item.values?.category, item.values?.buyerName || item.values?.itemName)} </td>
                               <td>{(item.values?.category !== 'sales' && item.values?.category !== 'buys' && (item.values.name ? item.values?.name.charAt(0)+item.values?.name.slice(1).toLowerCase() : item.values?.borrower.charAt(0)+item.values?.borrower.slice(1).toLowerCase())) || 'Miner'}</td>
                               <td>{item.values?.receiver ? item.values?.receiver.charAt(0)+item.values?.receiver.slice(1).toLowerCase() : item.values?.name.charAt(0)+item.values?.name.slice(1).toLowerCase()}</td>
                               <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
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
      pend: state.firestore.ordered.pending_transactions,
      verify: state.firestore.data.verification_data,
      pendEggs: state.firestore.ordered.pend_eggs_collected
  }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data'},
        {collection: 'pending_transactions' },
        {collection: 'pend_eggs_collected', orderBy: ['date_', 'asc']},
        {collection: 'verification_data', doc: 'root'}
    ])
)(Dashboard);
