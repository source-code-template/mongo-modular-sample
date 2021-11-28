export const config = {
  port: 8080,
  log: {
    level: 'info',
    map: {
      time: '@timestamp',
      msg: 'message'
    }
  },
  mongo: {
    uri: 'mongodb+srv://dbUser:Demoaccount1@projectdemo.g0lah.mongodb.net',
    db: 'masterdata'
  }
};
