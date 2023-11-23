export const initState = {
    authError: null,
    farm_id: -1,
}


const authReducer = function(state = initState, action) {
    switch (action.type) {
        case 'LOGIN_ERROR':
            console.log('login error')
            return {
                ...state,
                authError: 'Login failed'
            }
        case 'LOGIN_SUCCESS':
            console.log('login success');
            try {
                localStorage.setItem('user', action._user);
                localStorage.setItem('name', action._name);
            } catch (e) {
                console.log(e)
            }
            console.log("USER", action._user);
            return {
                ...state,
                farm_id: action._user.farm_id,
                authError: null
            }


        case 'ADMIN_ERROR':
            console.log('admin error', action.err.message);
            return {
                ...state,
                authError: action.err.message,
                admin: false
            }

        case 'SIGN_OUT_ERROR':
            console.log('signout error');
            return state;

        case 'SIGN_OUT_SUCCESS':
            console.log('signed out');
            localStorage.clear();
            window.location = "/user-pages/login-1";
            return state;

        case 'SIGNUP_SUCCESS':
            console.log('signup success');
            try {
                localStorage.setItem('user', action._user);
            } catch (e) {
                console.log(e)
            }
            return {
                ...state,
                authError: null
            };

        case 'SIGNUP_ERROR':
            console.log('signup error', action.err.message);
            return {
                ...state,
                authError: action.err.message,
            }

        default:
            return state;
    }
}

export default authReducer
