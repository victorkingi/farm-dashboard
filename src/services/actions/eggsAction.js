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

        //TODO Cloud function queries previous doc to add all values together
        //TODO If sunday, get percentage store in same doc

      /*  if (valid) {
            if (count % 2 !== 0) {
                firestore.collection('eggs_collected').where("date", "==", date)
                    .get().then((query) => {
                    query.forEach((doc) => {
                        const data = doc.data();
                        if (JSON.parse(data.replaced) === false) {
                            const err = new Error("Doc doesn't exist!");
                            console.error(err.message);
                            window.alert(err);
                            return null;
                        }
                    })
                });
            } else {
                //check for duplicate
                firestore.collection('eggs_collected').where("date", "==", date)
                    .get().then((query) => {
                        query.forEach((doc) => {
                            const data = doc.data();

                            if (JSON.parse(data.replaced) === false) {
                                const err = new Error("Invalid data!");
                                console.error(err.message);
                                window.alert(err);
                                return null;
                            }
                        })
                });

                //check if chronological
                firestore.collection('eggs_collected')
                    .orderBy("date", "desc").limit(10)
                    .get().then((query) => {
                    let found = false;
                    query.forEach((doc) => {
                        if (found) {
                            return;
                        }
                        const data = doc.data();

                        const prevDate = data.date.toDate().getTime();
                        const diff = date.getTime() - prevDate;

                        if (diff !== 86400000) {
                            const err = new Error("Invalid date! Must be chronological order");
                            console.error(err.message);
                            window.alert(err);
                            window.location.reload();
                            return null;
                        } else {
                            found = true;
                        }
                    })
                });
            }
        }
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();
        const dayOfTheWeek = date.getDay();
        const endMonth = isLastDay(date);
        const eggDocRef = firestore.collection("eggs_collected").doc();
        const traysDocRef = firestore.collection("trays").doc("current_trays");
        const chickenDocRef = firestore.collection("chicken_details").doc("current");
        const a1 = parseInt(eggs['A 1']);
        const a2 = parseInt(eggs['A 2']);
        const b1 = parseInt(eggs['B 1']);
        const b2 = parseInt(eggs['B 2']);
        const c1 = parseInt(eggs['C 1']);
        const c2 = parseInt(eggs['C 2']);
        const store_values = eggs.trays_store;
        const current_eggs = parseInt(store_values.substring(store_values.lastIndexOf(',')+1));
        const cur_trays = parseInt(store_values.substring(0, store_values.lastIndexOf(',')));
        const tempArr = [a1, a2, b1, b2, c1, c2];
        const house = parseInt(eggs['house']);
        const myTotal = a1 + a2 + b1 + b2 + c1 + c2 + house;
        const cagedTotal = a1 + a2 + b1 + b2 + c1 + c2;
        const cageTotal = parseInt(cagedTotal);
        const total = parseInt(myTotal);
        const load = document.getElementById("loading-eggs");
        const submit = document.getElementById("egg7");
        let oldDate = date.getTime() - 86400000;
        oldDate = new Date(oldDate);

        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i] > 75 || tempArr[i] < 0) {
                const error = new Error("Impossible values entered!");
                dispatch({type: 'INPUT_BUYING_ERROR', error});
                window.alert(error);
                submit.style.display = 'block';
                load.style.display = 'none';
                return error;
            }
        }

        firestore.collection("eggs_collected").where("date", "==", oldDate)
            .get().then((query) => {
                if (query.size > 1 || query.size === 0) {
                    let found = 0;
                    query.forEach((doc) => {
                        if (JSON.parse(doc.data().replaced) === false) {
                            found += 1;
                        }
                    });
                    if (found !== 1) {
                        window.alert("ERROR!");
                        window.location.reload()
                        return null;
                    }
                }
                query.forEach((eggPreviousDoc) => {
                    firestore.runTransaction(function (transaction) {
                        return transaction.get(traysDocRef).then(function (trayDoc) {
                                return transaction.get(chickenDocRef).then(function (chickenDoc) {
                                        if (eggPreviousDoc.exists) {
                                            if (trayDoc.exists) {
                                                if (chickenDoc.exists) {
                                                    const final = cur_trays;
                                                    const myRemainder = current_eggs;
                                                    const chickenNo = parseInt(chickenDoc.data().total);
                                                    const prevAllWeeklyEggs = parseInt(eggPreviousDoc.data().allWeeklyEggs);
                                                    const prevCageWeeklyEggs = parseInt(eggPreviousDoc.data().cageWeeklyEggs);
                                                    const prevHouseWeeklyEggs = parseInt(eggPreviousDoc.data().houseWeeklyEggs);
                                                    const prevAllMonthlyEggs = parseInt(eggPreviousDoc.data().allMonthlyEggs);
                                                    const prevCageMonthlyEggs = parseInt(eggPreviousDoc.data().cageMonthlyEggs);
                                                    const prevHouseMonthlyEggs = parseInt(eggPreviousDoc.data().houseMonthlyEggs);
                                                    const cageNo = parseInt(chickenDoc.data().cage);
                                                    const houseNo = parseInt(chickenDoc.data().house);
                                                    let allWeeklyEggs = total + prevAllWeeklyEggs;
                                                    let houseWeeklyEggs = house + prevHouseWeeklyEggs;
                                                    let cageWeeklyEggs = cageTotal + prevCageWeeklyEggs;
                                                    let allMonthlyEggs = total + prevAllMonthlyEggs;
                                                    let houseMonthlyEggs = house + prevHouseMonthlyEggs;
                                                    let cageMonthlyEggs = cageTotal + prevCageMonthlyEggs;

                                                    if (dayOfTheWeek === 0 && endMonth) {
                                                        const weeklyAllPercent = ((prevAllWeeklyEggs / 7) / chickenNo) * 100;
                                                        const weeklyCagePercent = ((prevCageWeeklyEggs / 7) / cageNo) * 100;
                                                        const weeklyHousePercent = ((prevHouseWeeklyEggs / 7) / houseNo) * 100;
                                                        const monthAllPercent = ((prevAllMonthlyEggs / 30) / chickenNo) * 100;
                                                        const monthCagePercent = ((prevCageMonthlyEggs / 30) / cageNo) * 100;
                                                        const monthHousePercent = ((prevHouseMonthlyEggs / 30) / houseNo) * 100;

                                                        transaction.update(chickenDocRef, {
                                                            weekPercent: weeklyAllPercent,
                                                            monthPercent: monthAllPercent,
                                                            weekCagePercent: weeklyCagePercent,
                                                            weekHousePercent: weeklyHousePercent,
                                                            submittedOn: new Date()
                                                        })

                                                        transaction.set(eggDocRef, {
                                                            ...eggs,
                                                            weeklyAllPercent: weeklyAllPercent,
                                                            weeklyCagePercent: weeklyCagePercent,
                                                            weeklyHousePercent: weeklyHousePercent,
                                                            monthAllPercent: monthAllPercent,
                                                            monthCagePercent: monthCagePercent,
                                                            monthHousePercent: monthHousePercent,
                                                            allWeeklyEggs: total,
                                                            cageWeeklyEggs: cageTotal,
                                                            houseWeeklyEggs: house,
                                                            allMonthlyEggs: total,
                                                            cageMonthlyEggs: cageTotal,
                                                            houseMonthlyEggs: house,
                                                            date,
                                                            submittedBy: name,
                                                            submittedOn: new Date()
                                                        })
                                                        }
                                                    else if (dayOfTheWeek === 0) {
                                                            const weeklyAllPercent = ((prevAllWeeklyEggs / 7) / chickenNo) * 100;
                                                            const weeklyCagePercent = ((prevCageWeeklyEggs / 7) / cageNo) * 100;
                                                            const weeklyHousePercent = ((prevHouseWeeklyEggs / 7) / houseNo) * 100;

                                                            transaction.update(chickenDocRef, {
                                                                weekPercent: weeklyAllPercent,
                                                                weekCagePercent: weeklyCagePercent,
                                                                weekHousePercent: weeklyHousePercent,
                                                                submittedOn: new Date()
                                                            })

                                                            transaction.set(eggDocRef, {
                                                                ...eggs,
                                                                weeklyAllPercent: weeklyAllPercent,
                                                                weeklyCagePercent: weeklyCagePercent,
                                                                weeklyHousePercent: weeklyHousePercent,
                                                                allWeeklyEggs: total,
                                                                cageWeeklyEggs: cageTotal,
                                                                houseWeeklyEggs: house,
                                                                allMonthlyEggs: allMonthlyEggs,
                                                                cageMonthlyEggs: cageMonthlyEggs,
                                                                houseMonthlyEggs: houseMonthlyEggs,
                                                                date: date,
                                                                submittedBy: name,
                                                                submittedOn: new Date()
                                                            })
                                                        }
                                                    else if (endMonth) {
                                                            const monthAllPercent = ((prevAllMonthlyEggs / 30) / chickenNo) * 100;
                                                            const monthCagePercent = ((prevCageMonthlyEggs / 30) / cageNo) * 100;
                                                            const monthHousePercent = ((prevHouseMonthlyEggs / 30) / houseNo) * 100;

                                                            transaction.update(chickenDocRef, {
                                                                monthPercent: monthAllPercent,
                                                                submittedOn: new Date()
                                                            })

                                                            transaction.set(eggDocRef, {
                                                                ...eggs,
                                                                monthAllPercent: monthAllPercent,
                                                                monthCagePercent: monthCagePercent,
                                                                monthHousePercent: monthHousePercent,
                                                                allWeeklyEggs: allWeeklyEggs,
                                                                cageWeeklyEggs: cageWeeklyEggs,
                                                                houseWeeklyEggs: houseWeeklyEggs,
                                                                allMonthlyEggs: total,
                                                                cageMonthlyEggs: cageTotal,
                                                                houseMonthlyEggs: house,
                                                                date,
                                                                submittedBy: name,
                                                                submittedOn: new Date()
                                                            })
                                                        }
                                                    else {
                                                            transaction.set(eggDocRef, {
                                                                ...eggs,
                                                                allWeeklyEggs: allWeeklyEggs,
                                                                cageWeeklyEggs: cageWeeklyEggs,
                                                                houseWeeklyEggs: houseWeeklyEggs,
                                                                allMonthlyEggs: allMonthlyEggs,
                                                                cageMonthlyEggs: cageMonthlyEggs,
                                                                houseMonthlyEggs: houseMonthlyEggs,
                                                                date,
                                                                submittedBy: name,
                                                                submittedOn: new Date()
                                                            })
                                                        }

                                                        transaction.set(traysDocRef, {
                                                            number: final,
                                                            remainder: myRemainder,
                                                            submittedBy: name,
                                                            submittedOn: new Date()
                                                        })
                                                    }
                                                else {
                                                    return Promise.reject("ERROR: doc not found!");
                                                }
                                            } else {
                                                return Promise.reject("ERROR: No tray doc found!");
                                            }
                                        } else {
                                            return Promise.reject("ERROR: doc not found!");
                                        }
                                    })
                                })
                            }).then(() => {
                                dispatch({type: 'INPUT_EGGS', eggs});
                                window.alert("Data submitted");
                                load.style.display = 'none';
                                submit.style.display = 'block';
                            }).catch((err) => {
                                const error = err.message || err;
                                dispatch({type: 'INPUT_EGGS_ERROR', error});

                                window.alert(err);
                                load.style.display = 'none';
                                window.location = '/';

                            })
                        });
                    });  */
    }
};
