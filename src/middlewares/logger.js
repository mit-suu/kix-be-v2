const morgan = require('morgan');

function logger(app){
app.use(morgan('dev'));
}
module.exports = logger