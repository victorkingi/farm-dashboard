export const signIn = (user, err) => {
    return (dispatch) => {
        if (user === null) {
            dispatch({type: 'LOGIN_ERROR', err})
        } else {
            const _user = user?.user?.email;
            let _name = user?.user?.displayName;
            _name = _name.substring(0, _name.lastIndexOf(' '));
            dispatch({type: 'LOGIN_SUCCESS', _user, _name })
        }
    }
}

export const checkClaims = () => {
    return function(dispatch, getState, {getFirebase}) {
        const firebase = getFirebase();
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                user.getIdTokenResult().then(function(idToken) {
                    if (idToken.claims.admin) dispatch({type: 'ADMIN_ACCESS'})
                    else if (idToken.claims.moderator) dispatch({type: 'MOD_ACCESS'})
                    else if (idToken.claims.changer) dispatch({type: 'CHANGER_ACCESS'})
                }).catch(function(err){
                    dispatch({type: 'ADMIN_ERROR', err})
                })
            }
        });
    }
}


export const signOut = function(){
    return (dispatch, getState, {getFirebase}) => {
        const firebase = getFirebase();
        firebase.auth().signOut()
            .then(() => {
                dispatch({type: 'SIGN_OUT_SUCCESS'})
            }).catch((err) => {
            dispatch({type: 'SIGN_OUT_ERROR', err})
        });
    }
}

export const signUp = function(newUser) {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();

        firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            .then((resp) => {
                firebase.auth().onAuthStateChanged(function(user) {
                    if (user) {
                        if (!user.displayName) {
                            user.updateProfile({
                                displayName: `${newUser.firstName} ${newUser.lastName}`
                            });
                        }
                    }
                });

                return firestore.collection('users').doc(resp.user.uid).set({
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    initials: newUser.firstName[0] + newUser.lastName[0],
                    email: newUser.email
                })
            }).then((user) => {
            const _user = user.user.email;
            dispatch({type: 'SIGNUP_SUCCESS', _user})
        }).catch(err => {
            dispatch({type: 'SIGNUP_ERROR', err})
        });
    }
}

