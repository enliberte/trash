const delay = delayMs => {
    console.log('STARTED')
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + delayMs);
    while (new Date() < endDate) {}
    console.log('ENDED')
}

delay(5000)