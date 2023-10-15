import express from 'express';
import superagent from 'superagent';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const agent = superagent.agent()
    .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0')
    .set('origin', 'https://www.ratemyprofessors.com')
    .set('referer', 'https://www.ratemyprofessors.com/')
    .set('content-type', 'application/json')
    .set('authorization', 'Basic dGVzdDp0ZXN0')

app.post('/graphql', async (req, resp) => {
    agent.post('https://www.ratemyprofessors.com/graphql')
        .send(req.body)
        .then(res => {
            if (res.text.trim() === 'Unauthorized')
                return resp.status(500).json({
                    success: false,
                });

            console.log(`Sending data to ${req.headers['x-forwarded-for'] ?? req.ip} for '${req.body?.variables?.query?.text}'`)

            resp.json(res.body);
        })
        .catch(error => {
            console.log(`Failed to make GraphQL request to RateMyProfessors:`, error);

            resp.status(500).json({
                success: false,
            });
        });
})

app.get('*', (req, resp) => {
    resp.redirect('https://danny.ink/');
});

app.listen(80);
