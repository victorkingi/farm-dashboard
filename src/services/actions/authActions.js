export const signIn = (user, err) => {
    return (dispatch) => {
        if (user === null) {
            dispatch({type: 'LOGIN_ERROR', err})
        } else {
            const _user = user?.user?.email;
            let _name = user?.user?.displayName;
            if (_name) _name = _name.substring(0, _name.lastIndexOf(' '));
            else _name = 'Test';

            dispatch({type: 'LOGIN_SUCCESS', _user, _name })
        }
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
