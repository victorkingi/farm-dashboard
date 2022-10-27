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
  const { acc, dashboard, pend, firebase, firestore, verify, pendEggs } = props;

  const [bank, setBank] = useState(0);
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
              const loss = data.loss;
              const birdsNo = data.birds_no;

              db.collection('hashes').delete().then(() => {
                  db.collection('hashes').add({
                      id: 1,
                      hashes,
                      loss,
                      root: verify.root.root,
                      birdsNo
                  });
              }).catch(() => {
                  db.collection('hashes').add({
                      id: 1,
                      hashes,
                      loss,
                      root: verify.root.root,
                      birdsNo
                  });
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
            if (pend[k].values?.name !== __user__
                && pend[k].values?.name !== "ANNE" && pend[k].values?.name !== "BANK") {
                allDisable = true;
                break;
            }
          }
          if (pend[k].submittedBy && pend[k].submittedBy !== __user__) {
              allDisable = true;
              break;
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
                      const imageRef = storageRef.child(`dead_sick_batch_2/${fileName}`);
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

  useEffect(() => {
      if (acc) {
          const addrs = [];
          for (let addr of Object.keys(acc[0])) {
              if (addr.endsWith('BANK')) {
                  addrs.push(addr);
              }
          }
          let bankTotal = 0;
          for (let addr of addrs) {
              bankTotal += acc[0][addr];
          }
          setBank(bankTotal);
      }
  }, [acc]);

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

  if (JSON.stringify(dash) !== JSON.stringify({}) && dash?.week_profit) {
   const name = localStorage.getItem('name').toUpperCase();

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
                                     <h3 className="mb-0">KSh {numeral(dash.week_profit[0]).format("0,0")}</h3>
                                     <p className={`text-${dash.week_profit[1]
                                     < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                                         {dash.week_profit[1] < 0
                                             ? numeral(dash.week_profit[1]).format("0,0.0")
                                             : '+'.concat(dash.week_profit[1])}%
                                     </p>
                                 </div>
                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-${dash.week_profit[1]< 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${dash.week_profit[1] < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Week Profit ({moment(dash.week_profit[2]*1000).format('MMM Do YY')})</h6>
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
                                             end={dash.laying.day[0]}
                                             duration={2.75}
                                             delay={1}
                                             onEnd={() => setDone1(true)}
                                         />}{done1 && numeral(dash.laying.day[0]).format("0,0")}%</h3>
                                     <p className={`text-${ dash.laying.day[1]
                                     < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                                         {dash.laying.day[1] < 0
                                             ? numeral(dash.laying.day[1]).format("0,0.0")
                                             : '+'.concat(numeral(dash.laying.day[1]).format("0,0.0"))}%
                                     </p>
                                 </div>

                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-${dash.laying.day[1] < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${dash.laying.day[1] < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Lay Percent Day ({moment(dash.laying.day[2]*1000).format('MMM Do YY')})</h6>
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
                                             end={dash.laying.week[0]}
                                             duration={2.75}
                                             delay={1}
                                             onEnd={() => setDone1(true)}
                                         />}{done1 && numeral(dash.laying.week[0]).format("0,0")}%</h3>
                                     <p className={`text-${ dash.laying.week[1]
                                     < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                                         {dash.laying.week[1] < 0
                                             ? numeral(dash.laying.week[1]).format("0,0.0")
                                             : '+'.concat(numeral(dash.laying.week[1]).format("0,0.0"))}%
                                     </p>
                                 </div>

                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-${dash.laying.week[1] < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${dash.laying.week[1] < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Lay Percent Week ({moment(dash.laying.week[2]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">KSh {numeral(dash.month_profit[0]).format("0,0")}</h3>
                                     <p className={`text-${dash.month_profit[1]
                                     < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                                         {dash.month_profit[1] < 0
                                             ? numeral(dash.month_profit[1]).format("0,0.0")
                                             : '+'.concat(numeral(dash.month_profit[1]).format("0,0.0"))}%
                                     </p>
                                 </div>
                             </div>
                             <div className="col-3">
                                 <div
                                     className={`icon icon-box-${dash.month_profit[1] < 0 ? 'danger' : 'success'}`}>
                      <span
                          className={`mdi mdi-arrow-${dash.month_profit[1] < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                                 </div>
                             </div>
                         </div>
                         <h6 className="text-white-80 font-weight-normal">Month Profit ({moment(dash.month_profit[2]*1000).format('MMM Do YY')})</h6>
                     </div>
                 </div>
             </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-9">
                                 <div className="d-flex align-items-center align-self-start">
                                     <h3 className="mb-0">{numeral(dash.birds.total).format("0,0")}</h3>
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
                         <h6 className="text-white-80 font-weight-normal">Current Debt</h6>
                     </div>
                 </div>
             </div>
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
                 <h6 className="text-white-80 font-weight-normal">Amount Available to Withdraw</h6>
               </div>
             </div>
           </div>
             <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
             <div className="card">
               <div className="card-body">
                     <div className="row">
                       <div className="col-9">
                         <div className="d-flex align-items-center align-self-start">
                           <h3 className="mb-0">Ksh {numeral(bank).format("0,0")}</h3>
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
                 <h6 className="text-white-80 font-weight-normal">Bank Balance</h6>
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
                       <h6 className="text-white-80 font-weight-normal">Trays and Eggs in Store <br /> ({moment(dash.last_trays_date*1000).format('MMM Do YY')})</h6>
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
                               <th> eggs</th>
                               <th> broken</th>
                               <th> by</th>
                           </tr>
                           </thead>
                           <tbody>
                           {pendEggs && pendEggs.map((item) => {
                               let disCheckBox = name !== item.submittedBy;

                               return (
                                   <tr key={item.id} className={`text-${(item.rejected === true || item.rejected === false) ? 'white' : 'muted'}`}>
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
                                                   : (item?.ready === true ? <div className="badge badge-outline-success">Pending</div>
                                                       : <div className="badge badge-outline-primary">Waiting</div>)}
                                       </td>
                                       <td> {moment(item.date_ * 1000).format("MMM Do YY")} </td>
                                       <td> {item.trays_store} </td>
                                       <td> {item.eggs.slice(0, item.eggs.length-1)} </td>
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
                     <tr className="text-white">
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
                         let disCheckBox = name !== item.values?.name;
                         disCheckBox = disCheckBox && "ANNE" !== item.values?.name;
                         disCheckBox = disCheckBox && "BANK" !== item.values?.name;
                         if (item.id === "cleared") return null;
                         if (item.category === 'deadSick') {
                             disCheckBox = name !== item.submittedBy;
                             return (
                                 <tr key={item.id} className={`text-${(item.rejected === true || item.rejected === false) ? 'white' : 'muted'}`}>
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
                                                 : (item?.ready === true ? <div className="badge badge-outline-success">Pending</div>
                                                     : <div className="badge badge-outline-primary">Waiting</div>)}
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
                           <tr key={item.id} className={`text-${(item.rejected === true || item.rejected === false) ? 'white' : 'muted'}`}>
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
                                           : (item?.ready === true ? <div className="badge badge-outline-success">Pending</div>
                                               : <div className="badge badge-outline-primary">Waiting</div>)}
                               </td>
                               <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                               <td> {item.values?.reason === "WITHDRAW" ? "Withdrawal" : sanitize_string(item.values)} </td>
                               <td>{['buys', 'sales'].includes(item.values?.category) ? 'Faucet' : (item.values?.name !== 'BLACK_HOLE' ? cleanAddress(item.values?.name) : 'Faucet')}</td>
                               <td>{(item.values?.receiver === 'BLACK_HOLE' ? 'Faucet' : (item.values?.receiver && item.values?.reason !== "WITHDRAW" ? (item.values?.receiver && item.values?.receiver.charAt(0)+item.values?.receiver.slice(1).toLowerCase()) : item.values?.reason === "WITHDRAW" ? (item.values?.initiator && item.values?.initiator.charAt(0)+item.values?.initiator.slice(1).toLowerCase()) : (item.values?.name && item.values?.name.charAt(0)+item.values?.name.slice(1).toLowerCase())))}</td>
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
      acc: state.firestore.ordered.accounts,
      pend: state.firestore.ordered.pending_transactions,
      verify: state.firestore.data.verification_data,
      pendEggs: state.firestore.ordered.pend_eggs_collected
  }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data'},
        {collection: 'accounts'},
        {collection: 'pending_transactions' },
        {collection: 'pend_eggs_collected', orderBy: ['date_', 'asc']},
        {collection: 'verification_data', doc: 'root'}
    ])
)(Dashboard);
