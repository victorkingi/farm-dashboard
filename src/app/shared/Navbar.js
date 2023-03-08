import React, { useMemo, useState, useRef } from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import { Dropdown } from 'react-bootstrap';
import {Link, Redirect} from 'react-router-dom';
import {signOut} from "../../services/actions/authActions";
import {firestoreConnect} from "react-redux-firebase";
import { Line } from 'rc-progress';
import moment from "moment";
import {getRanColor} from "../dashboard/Dashboard";
import {Alert} from "../form-elements/InputEggs";
import Snackbar from "@material-ui/core/Snackbar";
import Localbase from "localbase";

const uploadLock = [];
const db = new Localbase('ver_data');

function Navbar(props) {
  const lock = useRef(0);
  const { pending_upload, firestore, firebase, verify } = props;
  const [state, setState] = useState({
    color: new Map(),
    percent: new Map()
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setOpenError(false);
  };

  useMemo(() => {
    let isSubscribed = true;

    const writeToDb = async () => {
      console.log("Writing to DB...");
      let verDoc = await firestore.get({ collection: 'verification_data', doc: 'verification' });
      verDoc = verDoc.data();
      const hashes = new Array(...verDoc.hashes).sort();
      const loss = verDoc.loss;
      const birdsNo = verDoc.birds_no;
      await db.collection('hashes').doc('ver').set({
          hashes,
          loss,
          root: verify.root.root,
          birdsNo
        });
      return Promise.resolve(0);
    }

    if (isSubscribed && verify?.root && lock.current === 0) {
      lock.current = 1;
      const res = db.collection('hashes').doc('ver')
          .get().then((doc) => {
            if (doc !== null) {
              if (doc.root === verify.root.root) {
                console.log("root hashes match no update needed");
                return Promise.resolve(1);
              }
            }
            return writeToDb();
      });
      if (res) lock.current = 0;
    }

    return () => isSubscribed = false;

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verify]);

  useMemo(() => {
    let mounted = true;

    const finaliseUpload = async () => {
      if (mounted && pending_upload) {
        const storage = firebase.storage();
        const db = new Localbase('imageUpload');
        const storageRef = storage.ref();
        const docs = await db.collection('dead_sick').get();
        let p = localStorage.getItem('name') || '';
        p = p.toUpperCase();

        if (docs.length === 0) {
          for (let tx of pending_upload) {
            tx = tx.values;

            if (p === tx.submitted_by) {
              setOpen(false);
              setError("Found cloud document that does not have corresponding local");
              setOpenError(true);
              return;
            }
          }
        }

        for (let tx of pending_upload) {
          tx = tx.values;
          if (!(docs.map(x => x.file_name).includes(tx.file_name)) && p === tx.submitted_by) {
            setOpen(false);
            setError("Cloud document "+tx.file_name.slice(0, 10)+" does not exist locally");
            setOpenError(true);
            return;
          }
        }

        const getExt = file => {
          return file.substring(file.lastIndexOf('.')+1);
        }

        //gets key value pairs of all pending files
        const allStorage = async () => {
          const keyPair = new Map();
          const query = await db.collection('dead_sick').get();
          for (let k = 0; k < query.length; k++) {
            keyPair.set(query[k].file_name, query[k].image);
          }
          return keyPair;
        }

        const keyPair = await allStorage();
        keyPair.forEach((value, key) => {
          if (uploadLock.includes(key)) {
            console.log("key exists", key);
            return;
          } else {
            uploadLock.push(key);
            console.log("added to list", uploadLock);
          }

          const uploadFile = () => {
            const uploadImagesRef = storageRef.child(`dead_sick_batch_2/${key}`);
            const metadata = {
              contentType: `image/${getExt(key.substring(5))}`
            }

            const uploadTask = uploadImagesRef.put(value, metadata);
            uploadTask.on('state_changed', snapshot => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  console.log("Upload is " + progress + " % done");
                  let prev = state.percent;
                  let prevColor = state.color;
                  prev.set(key, progress);
                  prevColor.set(key, getRanColor());
                  setState({
                    percent: prev,
                    color: prevColor
                  });
                  switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                      console.log('Upload is paused');
                      break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                      console.log('Upload is running');
                      break;
                    default:
                  }
                },
                error => {
                  let index;
                  switch (error.code) {
                    case 'storage/unauthorized':
                      setOpen(false);
                      setError("You don't have permission to perform this task");
                      setOpenError(true);

                      index = uploadLock.indexOf(key);
                      if (index === -1) {
                        console.log("Unknown entry being deleted");
                        return;
                      }
                      uploadLock.splice(index, 1);

                      break;
                    case 'storage/canceled':
                      setOpen(false);
                      setError("Upload successfully cancelled");
                      setOpenError(true);

                      index = uploadLock.indexOf(key);
                      if (index === -1) {
                        console.log("Unknown entry being deleted");
                        return;
                      }
                      uploadLock.splice(index, 1);

                      break;
                    case 'storage/unknown':
                      setOpen(false);
                      setError("Unknown error occurred");
                      setOpenError(true);

                      index = uploadLock.indexOf(key);
                      if (index === -1) {
                        console.log("Unknown entry being deleted");
                        return;
                      }
                      uploadLock.splice(index, 1);
                      break;
                    default:
                  }
                },
                async () => {
                  const url = await uploadTask.snapshot.ref.getDownloadURL();
                  console.log('done', url);
                  const query = await firestore.get({ collection: 'pending_upload', where: ['values.file_name', '==', key] });
                  if (query.size === 0) {
                    setOpen(false);
                    setError("Uploaded file doesn't have a reference");
                    setOpenError(true);

                    const index = uploadLock.indexOf(key);
                    if (index === -1) {
                      console.log("Unknown entry being deleted");
                      return;
                    }
                    uploadLock.splice(index, 1);
                    return;
                  }
                  else if (query.size > 1) {
                    setOpen(false);
                    setError("More than one match: " + query.size + " found");
                    setOpenError(true);

                    const index = uploadLock.indexOf(key);
                    if (index === -1) {
                      console.log("Unknown entry being deleted");
                      return;
                    }
                    uploadLock.splice(index, 1);
                    return;
                  }
                  for (const doc of query.docs) {
                    let to_add = doc.data();
                    let to_del_id = doc.id;
                    console.log("to be deleted", to_del_id);
                    delete to_add.values.photo;
                    to_add.values.url = url;

                    // delete local doc
                    db.collection('dead_sick').doc({file_name: key}).delete();
                    firestore.set({ collection: 'pending_transactions', doc: to_del_id }, to_add);
                    firestore.delete({ collection: 'pending_upload', doc: to_del_id });

                    setOpenError(false);
                    let imageName = key;
                    if (key.length > 10) imageName = imageName.substring(5, 10) + '...' + imageName.substr(-4);
                    setSuccess(`Image ${imageName} uploaded`);
                    setOpen(true);
                    const index = uploadLock.indexOf(key);
                    if (index === -1) {
                      console.log("Unknown entry being deleted");
                      return;
                    }
                    uploadLock.splice(index, 1);
                  }
                });
          }
          uploadFile();
        });
      }
    };

    if (pending_upload?.length > 0) finaliseUpload();

    return () => mounted = false;

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending_upload?.length]);

  const toggleOffcanvas = () => {
    document.querySelector('.sidebar-offcanvas').classList.toggle('active');
  }

  const logout = (e) => {
    e.preventDefault();
    props.signOut();
  }

  const user = useMemo(function() {
    const __user = localStorage.getItem('user') || false;
    const __name = localStorage.getItem('name') || 'User';

    return {__user, __name};
  }, []);

  if (!user.__user) {
    return (
        <Redirect to="/user-pages/login-1"/>
    )
  }

    return (
      <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
          <Link className="navbar-brand brand-logo-mini"  to="/"><img src={"https://firebasestorage.googleapis.com/v0/b/poultry101-f1fa0.appspot.com/o/logo192.png?alt=media&token=420012cd-80b9-483d-9f10-f3ee2c501988"} alt="logo" /></Link>
        </div>
        <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
          <button className="navbar-dark align-self-center" type="button" onClick={ () => window.location.reload() }>
            <span className="mdi mdi-refresh"/>
          </button>
          <button className="navbar-toggler align-self-center" type="button" onClick={ () => document.body.classList.toggle('sidebar-icon-only') }>
            <span className="mdi mdi-menu"/>
          </button>
          <ul className="navbar-nav w-100" />
          <ul className="navbar-nav navbar-nav-right">
            <li className="nav-item d-none d-lg-block">
              <a className="nav-link" href="!#" onClick={event => event.preventDefault()}>
                <i className="mdi mdi-view-grid"/>
              </a>
            </li>
            <Dropdown alignRight as="li" className="nav-item border-left">
              <Dropdown.Toggle as="a" className="nav-link count-indicator cursor-pointer">
                <i className="mdi mdi-bell"/>
                {pending_upload?.length > 0 && <span className="count bg-danger"/>}
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu navbar-dropdown preview-list">
                <h6 className="p-3 mb-0">Uploads</h6>
                <Dropdown.Divider />
                {
                  pending_upload?.length > 0 ? pending_upload.map((item) => {
                    const id = item.id;
                    item = item.values;
                    return (
                        <Dropdown.Item
                            key={id}
                            className="dropdown-item preview-item"
                            onClick={evt =>evt.preventDefault()}>
                          <div className="preview-thumbnail">
                            <div className="preview-icon bg-dark rounded-circle">
                              {(state.percent.get(item.file_name) === 0 || state.percent.get(item.file_name) === undefined) && <i className={`mdi mdi-cloud-upload text-warning`}/>}
                              {state.percent.get(item.file_name) === 100 && <i className={`mdi mdi-cloud-upload text-success`}/>}
                              {state.percent.get(item.file_name) < 100 && state.percent.get(item.file_name) > 0 && <i className={`mdi mdi-cloud-upload text-info`}/>}
                            </div>
                          </div>
                          <div className="preview-item-content">
                            <p className="preview-subject mb-1">Uploading {item.submitted_by.toLowerCase()} entry {moment(item.submitted_on.toDate()).fromNow()}</p>
                            <p className="text-muted ellipsis mb-0">
                                <Line
                                      percent={state.percent.get(item.file_name)} strokeWidth="4" strokeColor={state.color.get(item.file_name)} />
                                <Line
                                    percent={[state.percent.get(item.file_name) / 2, state.percent.get(item.file_name) / 2]}
                                    strokeWidth="4"
                                    strokeColor={[state.color.get(item.file_name), '#CCC']}
                                />
                            </p>
                          </div>
                        </Dropdown.Item>
                    )
                  }) :
                      <Dropdown.Item
                      className="dropdown-item preview-item"
                      onClick={evt =>evt.preventDefault()}>
                    <div className="preview-thumbnail">
                      <div className="preview-icon bg-dark rounded-circle">
                        <i className="mdi mdi-cloud-upload text-success"/>
                      </div>
                    </div>
                    <div className="preview-item-content">
                      <p className="preview-subject mb-1">All caught up!</p>
                      <p className="text-muted mb-0">
                        No notifications currently available
                      </p>
                    </div>
                  </Dropdown.Item>
                }
                <Dropdown.Divider />
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown alignRight as="li" className="nav-item">
              <Dropdown.Toggle as="a" className="nav-link cursor-pointer no-caret">
                <div className="navbar-profile">
                  <img className="img-xs rounded-circle" src={"https://firebasestorage.googleapis.com/v0/b/poultry101-f1fa0.appspot.com/o/user.png?alt=media&token=a5508634-7688-48d4-a079-bfbff0724eb6"} alt="profile" />
                  <p className="mb-0 d-none d-sm-block navbar-profile-name">Hi, {user.__name}</p>
                  <i className="mdi mdi-menu-down d-none d-sm-block"/>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="navbar-dropdown preview-list navbar-profile-dropdown-menu">
                <h6 className="p-3 mb-0">Profile</h6>
                <Dropdown.Divider />
                <Dropdown.Item href="!#" onClick={evt =>evt.preventDefault()}  className="preview-item">
                  <div className="preview-thumbnail">
                    <div className="preview-icon bg-dark rounded-circle">
                      <i className="mdi mdi-logout text-danger"/>
                    </div>
                  </div>
                  <div className="preview-item-content">
                    <p className="preview-subject mb-1" onClick={logout}>Log Out</p>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ul>
          <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" onClick={toggleOffcanvas}>
            <span className="mdi mdi-format-line-spacing"/>
          </button>
        </div>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="success">
            {success}
          </Alert>
        </Snackbar>
        <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity="error">{error}!</Alert>
        </Snackbar>
      </nav>
    );
}

const mapStateToProps = function(state) {
  return {
    pending_upload: state.firestore.ordered.pending_upload,
    verify: state.firestore.data.verification_data
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    signOut: () => dispatch(signOut())
  }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
      {collection: 'pending_upload', orderBy: ['values.submitted_on', 'asc']},
      {collection: 'verification_data', doc: 'root'}
    ]))(Navbar);
