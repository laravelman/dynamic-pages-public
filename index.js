// ------------------ Fill the following details -----------------------------
// Student name:
// Student email:

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/final8020set2", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Order = mongoose.model("Order", {
  customerName: String,
  membershipNumber: String,
  doorbells: Number,
  cameras: Number,
  monitors: Number,
});

const Admin = mongoose.model("Admin", {
  username: String,
  password: String,
});

var myApp = express();
myApp.use(
  session({
    secret: "superrandomsecret",
    resave: false,
    saveUninitialized: true,
  })
);
myApp.use(bodyParser.urlencoded({ extended: false }));

myApp.set("views", path.join(__dirname, "views"));
myApp.use(express.static(__dirname + "/public"));
myApp.set("view engine", "ejs");

// Supporting Functions

// Regex Values
var membershipRegex =
  /^([a-zA-Z0-9-]{3})[\/\-]([a-zA-Z0-9-]{3})[\/\-]([a-zA-Z0-9-]{3})$/;
var quantityRegex = /^[0-9]*$/;

// Tax Rate
const taxRate = 0.13;

// Error Values
var requiredField = " is a required field";

// Products Details
var products = {
  videoDoorbells: {
    name: "Video Doorbells",
    price: 48.98,
  },
  outdoorCameras: {
    name: "Outdoor Cameras",
    price: 149.49,
  },
  babyMonitors: {
    name: "Baby Monitors",
    price: 99.99,
  },
};

// Cart Array
var cart = [];

/**
 * String empty or valid input check
 * @param {input value to be validated} inputValue
 * @param {validation regex to be applied} regex
 * @returns boolean - is a valid input or not
 */
function isValidInput(inputValue, regex) {
  if (regex.test(inputValue)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Custom membership number validation check
 * @param {membership number} inputValue
 * @returns boolean - is a valid phone or not
 */
function customMembershipValidation(inputValue) {
  if (!isValidInput(inputValue, membershipRegex)) {
    throw new Error("Membership Number should be in XXX-XXX-XXX format.");
  }
  return true;
}

/**
 * Custom product quantity validation check
 * @param {quantity} inputValue
 * @returns boolean - is a valid phone or not
 */
function customQuantityValidation(inputValue) {
  if (!isValidInput(inputValue, quantityRegex)) {
    throw new Error("Quantity should be in number.");
  }
  return true;
}

//------------- Use this space only for your routes ---------------------------

myApp.get("/", function (req, res) {
  // use this to display the order form
  res.render("index", { isLoggedIn: req.session.isLoggedIn });
});

myApp.get("/orders", function (req, res) {
  // use this to display all the orders when a user is logged in as admin
  // Check if logged in or not
  if (req.session.isLoggedIn) {
    // Get pages list
    Order.find({}).exec(function (error, orders) {
      // Check if there are any orders
      if (orders) {
        for (var [index, order] of orders.entries()) {
          // Sub total
          var subTotal = 0;

          // Get individual total of all products
          doorbellsTotal = order.doorbells * products.videoDoorbells.price;
          camerasTotal = order.cameras * products.outdoorCameras.price;
          monitorsTotal = order.monitors * products.babyMonitors.price;

          //increment subtotal
          subTotal = doorbellsTotal + camerasTotal + monitorsTotal;

          // Calculate Tax
          var tax = subTotal * taxRate;

          // Calculate Total
          var total = subTotal + tax;

          // Push data into order object
          order.tax = tax;
          order.subTotal = subTotal;
          order.total = total;
        }

        res.render("manage-orders", {
          orders: orders,
          isLoggedIn: req.session.isLoggedIn,
        });
      } else {
        res.render("manage-orders", {
          orders: [],
          isLoggedIn: req.session.isLoggedIn,
        });
      }
    });
  } else {
    // Redirect if not logged in
    res.redirect("/login");
  }
});

// write any other routes here as needed

/**
 * Apply validations on input fields
 */
myApp.post(
  "/",
  [
    check("name", "Name" + requiredField)
      .not()
      .isEmpty(),
    check("membershipNumber").custom(customMembershipValidation),
    check("videoDoorbells").custom(customQuantityValidation),
    check("outdoorCameras").custom(customQuantityValidation),
    check("babyMonitors").custom(customQuantityValidation),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format Form Errors to a better structure
      var formErrors = [];
      errors.array().forEach(function (error) {
        formErrors[error.param] = error.msg;
      });

      // Check for no products selection
      if (
        req.body.videoDoorbells == 0 &&
        req.body.outdoorCameras == 0 &&
        req.body.babyMonitors == 0
      ) {
        formErrors["quantityError"] = "Please Atleast Buy One Product";
      }
      res.render("index", {
        formErrors: formErrors,
        formData: req.body, // For already input values to prevent reinput
      });
    } else {
      // Check for no products selection
      if (
        req.body.videoDoorbells == 0 &&
        req.body.outdoorCameras == 0 &&
        req.body.babyMonitors == 0
      ) {
        var formErrors = [];
        formErrors["quantityError"] = "Please Atleast Buy One Product";
        res.render("index", {
          formErrors: formErrors,
          formData: req.body, // For already input values to prevent reinput
        });
      } else {
        // Customer Details
        var name = req.body.name;
        var membershipNumber = req.body.membershipNumber;

        // Product Quantity
        var videoDoorbellsQuantity = req.body.videoDoorbells;
        var outdoorCamerasQuantity = req.body.outdoorCameras;
        var babyMonitorsQuantity = req.body.babyMonitors;

        // Empty Global Cart Array to reset previous values
        cart = [];

        // Sub total
        var subTotal = 0;

        // Temp Value for total
        var tempTotal = 0;

        // Create Cart and Calculate total of each purchase
        if (videoDoorbellsQuantity != "" && videoDoorbellsQuantity > 0) {
          tempTotal = products.videoDoorbells.price * videoDoorbellsQuantity;
          //push into cart
          cart.push({
            name: products.videoDoorbells.name,
            price: products.videoDoorbells.price,
            quantity: videoDoorbellsQuantity,
            total: tempTotal,
          });
          //increment subtotal
          subTotal += tempTotal;
        }
        if (outdoorCamerasQuantity != "" && outdoorCamerasQuantity > 0) {
          tempTotal = products.outdoorCameras.price * outdoorCamerasQuantity;
          //push into cart
          cart.push({
            name: products.outdoorCameras.name,
            price: products.outdoorCameras.price,
            quantity: outdoorCamerasQuantity,
            total: tempTotal,
          });
          //increment subtotal
          subTotal += tempTotal;
        }
        if (babyMonitorsQuantity != "" && babyMonitorsQuantity > 0) {
          tempTotal = products.babyMonitors.price * babyMonitorsQuantity;
          //push into cart
          cart.push({
            name: products.babyMonitors.name,
            price: products.babyMonitors.price,
            quantity: babyMonitorsQuantity,
            total: tempTotal,
          });
          //increment subtotal
          subTotal += tempTotal;
        }

        if (cart.length == 0) {
          // Empty cart check
          res.render("index", {
            cart: cart,
            formData: req.body,
          });
        } else {
          // Calculate Tax
          var tax = subTotal * taxRate;

          // Calculate Total
          var total = subTotal + tax;

          // Form Response Data
          var checkoutData = {
            name: name,
            membershipNumber: membershipNumber,
            subTotal: subTotal,
            tax: tax,
            taxRateInPercent: taxRate * 100, // Convert tax rate to readable percentage
            total: total,
            cart: cart,
            errors: [],
          };

          // Gather data to save into database
          var saveData = {
            customerName: name,
            membershipNumber: membershipNumber,
            doorbells: videoDoorbellsQuantity,
            cameras: outdoorCamerasQuantity,
            monitors: babyMonitorsQuantity,
          };

          // Save data into database
          var saveOrder = new Order(saveData);

          saveOrder.save().then(() => console.log("New order created."));
          // Successful purchase response
          res.render("index", checkoutData);
        }
      }
    }
  }
);

/**
 * Admin Delete Page
 */
myApp.get("/delete-order/:orderId", function (req, res) {
  // Check if logged in or not
  if (req.session.isLoggedIn) {
    // Delete
    var orderId = req.params.orderId;
    // Find and delete order
    Order.findByIdAndDelete({ _id: orderId }).exec(function (error, order) {
      console.log("Error: " + error);
      console.log("DB: " + order);
      if (order) {
        // Respond with success message
        res.render("delete-order", {
          message: "Successfully deleted!",
          isLoggedIn: req.session.isLoggedIn,
        });
      } else {
        // Respond with error message
        res.render("delete-order", {
          message: "Something went wrong!",
          isLoggedIn: req.session.isLoggedIn,
        });
      }
    });
  } else {
    // Redirect if not logged in
    res.redirect("/");
  }
});

/**
 * Admin Login Page
 */
myApp.get("/login", function (req, res) {
  // Check if logged in or not
  if (req.session.isLoggedIn) {
    res.render("/orders", { isLoggedIn: req.session.isLoggedIn });
  } else {
    res.render("login", { isLoggedIn: req.session.isLoggedIn });
  }
});

/**
 * Admin Login Check Page
 */
myApp.post("/login", function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Admin.findOne({ username: username, password: password }).exec(function (
    error,
    admin
  ) {
    // Logging errors
    console.log("Error: " + error);
    console.log("DB: " + admin);

    if (admin) {
      // Store username in session and set logged in flag as true
      req.session.username = admin.username;
      req.session.isLoggedIn = true;

      // Redirect to admin dashboard
      res.redirect("/orders");
    } else {
      res.render("login", {
        error: "Invalid username or password!",
        isLoggedIn: req.session.isLoggedIn,
      });
    }
  });
});

/**
 * Admin Logout Page
 */
myApp.get("/logout", function (req, res) {
  // Reset session variables
  req.session.username = "";
  req.session.isLoggedIn = false;
  // Redirect to logout page
  // Check if there are any orders
  res.render("logout", { isLoggedIn: req.session.isLoggedIn });
});

//---------- Do not modify anything below this other than the port ------------
//------------------------ Setup the database ---------------------------------

myApp.get("/setup", function (req, res) {
  let adminData = [
    {
      username: "admin",
      password: "admin",
    },
  ];

  Admin.collection.insertMany(adminData);

  var firstNames = [
    "John ",
    "Alana ",
    "Jane ",
    "Will ",
    "Tom ",
    "Leon ",
    "Jack ",
    "Kris ",
    "Lenny ",
    "Lucas ",
  ];
  var lastNames = [
    "May",
    "Riley",
    "Rees",
    "Smith",
    "Walker",
    "Allen",
    "Hill",
    "Byrne",
    "Murray",
    "Perry",
  ];

  let ordersData = [];

  for (i = 0; i < 10; i++) {
    let tempMemb =
      "C" +
      Math.floor(Math.random() * 100) +
      "-ON" +
      Math.floor(Math.random() * 10) +
      "-" +
      Math.floor(Math.random() * 1000);
    let tempName =
      firstNames[Math.floor(Math.random() * 10)] +
      lastNames[Math.floor(Math.random() * 10)];
    let tempOrder = {
      customerName: tempName,
      membershipNumber: tempMemb,
      doorbells: Math.floor(Math.random() * 10),
      cameras: Math.floor(Math.random() * 10),
      monitors: Math.floor(Math.random() * 10),
    };
    ordersData.push(tempOrder);
  }

  Order.collection.insertMany(ordersData);
  res.send("Database setup complete. You can now proceed with your exam.");
});

//----------- Start the server -------------------

myApp.listen(8080); // change the port only if 8080 is blocked on your system
console.log("Server started at 8080 for mywebsite...");
