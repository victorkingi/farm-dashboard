const initState = {}

const deadSickReducer = (state = initState, action) => {
    switch (action.type) {
        case 'UPLOAD_DONE':
            console.log('Data Submitted');
            return state;
        case 'UPLOAD_ERROR':
            console.log('upload error', action.error);
            return state;
        default:
            return state;
    }
}

export default deadSickReducer;
