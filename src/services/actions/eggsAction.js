function getNextDayOfWeek(date, dayOfWeek) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

//when user inputs eggs
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...eggs,
            submittedBy: name,
            submittedOn: new Date()
        }
        values.layingPercentDay = getNextDayOfWeek(values.date_, 0).getTime();
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date_ = newDate.getTime();
        console.log(values);
        firestore.collection('eggs_collected').add({
            ...values
        });
    }
};
