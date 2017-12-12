import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as braintree from 'braintree';
import * as dotenv from 'dotenv';
import * as uuidv1 from 'uuid/v1';
dotenv.config();

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors()); // avoid Access-Control-Allow-Origin problem

/* PAYPAL CONFIG */
const gateway = braintree.connect({
  accessToken: process.env.ACCESS_TOKEN_SANDBOX // for production or sandbox
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
  console.log(req.body);

  // Use payment method nonce here
  const saleRequest = {
    amount,
    merchantAccountId: "EUR",
    paymentMethodNonce,
    orderId: uuidv1(),
    options: {
      paypal: {
        customField: "PayPal custom field",
        description: "Description for PayPal email receipt",
      },
      submitForSettlement: true
    }
  };

  gateway.transaction.sale(saleRequest, (err: any, result: any) => {
    if (err) {
      res.send({ error: err, saleRequest });
    } else if (result.success) {
      res.send({ success: true, message: `Success! Transaction ID: ${result.transaction.id}`, result });
    } else {
      res.send({ error: result.message, saleRequest, result });
    }
  });
}

/* BRAINTREE CONFIG */
const gatewayBraintree = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.MERCHANT_ID,
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY
});

function btClientToken(req: any, res: any):void {
  gatewayBraintree.clientToken.generate({}, (err: any, response: any) => {
    const json = { token: response.clientToken };
    res.send(json);
  });
}

function btCheckout(req: any, res: any):void {
  const paymentMethodNonce = req.body.nonce;
  const amount = parseFloat(req.body.amount);

  // Use payment method nonce here
  const saleRequest = {
    amount,
    paymentMethodNonce,
    options: {
      submitForSettlement: true
    }
  };

  gatewayBraintree.transaction.sale(saleRequest, (err: any, result: any) => {
    if (err) {
      res.send({ error: err, saleRequest });
    } else if (result.success) {
      res.send({ success: true, message: `Success! Transaction ID: ${result.transaction.id}`, result });
    } else {
      res.send({ error: result.message, saleRequest, result });
    }
  });
}

/* routes for paypal config */
app.get('/client_token', clientToken);
app.post('/checkout', checkout);

/* routes for braintree config */
app.get('/bt_client_token', btClientToken);
app.post('/bt_checkout', btCheckout);

app.listen(8001, () => console.log('Braintree server running on port 8001!'));
