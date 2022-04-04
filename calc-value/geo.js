const fetchCity = async (position) => {
    console.log('POSITION', position)
    return Promise.resolve('Boston')
}

const getGeoposition = async () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(geo => resolve(geo), error => reject(error));
    })
}

const getCurrentCityName = async () => {
    const position = await getGeoposition();
    const cityName = await fetchCity(position);

    return cityName;
}

getCurrentCityName()

