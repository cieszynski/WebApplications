
// https://stackoverflow.com/a/32748101

function kalenderwoche(date) {
    const
        msec = (days) => { return 86400000 * days; },
        value = date.valueOf(),
        value2 = (new Date(
            (new Date(
                value - msec(
                    (new Date(value - msec(1))).getDay() + 1
                ) + msec(4)
            )).getFullYear(), 0, 3).valueOf()
        );
    return ~~((value - value2 + msec((new Date(value2)).getDay() + 6)) / msec(7));
}

// console.log(kalenderwoche(Date.now()))

