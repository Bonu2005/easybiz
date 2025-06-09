const jwt = require("jsonwebtoken")

function selfPolice(roles) {
   console.log(roles);

   return (req, res, next) => {

      let { id } = req.params;
      let token = req.header("Authorization")
      try {
         let user = jwt.verify(token, process.env.accesstoken)
         req.user = user


         if (id == req.user.id && roles.includes(req.user.role)) {
            next();
            return;
         }
         res.status(400).send({ message: "Not allowed to change" });
      } catch (error) {
         res.status(400).send({ message: error.message });
      }

   };
}
module.exports = selfPolice;