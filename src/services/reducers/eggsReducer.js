const initState = {}

const eggsReducer = function(state = initState, action){
    switch (action.type) {
        case 'INPUT_EGGS':
            console.log('eggs data added', action.eggs);
            return state;
        case 'INPUT_EGGS_ERROR':
            console.log('eggs data error', action.error);
            return state;
        default:
            return state;
    }
}

export default eggsReducer;
