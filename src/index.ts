import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as braintree from 'braintree';

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors()); // avoid Access-Control-Allow-Origin problem

const gateway = braintree.connect({
  accessToken: 'YOUR_AWESOME_ACCESS_TOKEN' // for production or sandbox
});

/* methods */
function clientToken(req: any, res: any):void {
  gateway.clientToken.generate({}, (err: any, response: any) => {
    const json = { token: response.clientToken };
    res.send(json);
  });
}

function checkout(req: any, res: any):void {
  const paymentMethodNonce = req.body.nonce;
  const amount = parseFloat(req.body.amount);

  // Use payment method nonce here
  const saleRequest = {
    amount,
    merchantAccountId: "EUR",
    paymentMethodNonce,
    orderId: "Mapped to PayPal Invoice Number",
    descriptor: {
      name: "Descriptor displayed in customer CC statements. 22 char max"
    },
    shipping: {
      firstName: "Jen",
      lastName: "Smith",
      company: "Braintree",
      streetAddress: "1 E 1st St",
      extendedAddress: "5th Floor",
      locality: "Bartlett",
      region: "IL",
      postalCode: "08080",
      countryCodeAlpha2: "ES"
    },
    options: {
      paypal: {
        customField: "PayPal custom field",
        description: "Description for PayPal email receipt"
      },
      submitForSettlement: true
    }
  };

  gateway.transaction.sale(saleRequest, (err: any, result: any) => {
    if (err) {
      res.send({ error: err, saleRequest });
    } else if (result.success) {
      res.send({ success: true, message: `Success! Transaction ID: ${result.transaction.id}`});
    } else {
      res.send({ error: result.message, saleRequest, result });
    }
  });
}

/* routes */
app.get('/client_token', clientToken);
app.post('/checkout', checkout);


app.listen(8001, () => console.log('Braintree server running on port 8001!'));
