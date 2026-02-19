# API Service Setup


## Setting up Clerk Webhooks for Local Development

Clerk webhooks allow you to sync user data from Clerk to your application. The most important events are:
- `user.created` - Triggers when a new user registers
- `user.updated` - Triggers when user information changes
- `user.deleted` - Triggers when a user is removed

### Local Development Setup

1. **Set up ngrok**
   - Create an account at [ngrok dashboard](https://dashboard.ngrok.com/get-started/setup)
   - Install ngrok 
   - Save your forwarding URL from ngrok (e.g., `https://your-url.ngrok-free.app`) Do not use the *static* url (it changes everytime).

2. **Configure Clerk Webhook**
   - Go to Clerk Dashboard > Webhooks
   - Add Endpoint: `https://your-url.ngrok-free.app/api/webhooks`
   - Select events you want to listen to (e.g., `user.created`)
   - Copy the Signing Secret

3. **Environment Setup**
   ```env
   DATABASE_URL="your_database_url"
   CLERK_WEBHOOK_SECRET="your_signing_secret"
   ```

4. **Run ngrok**
    You can run ngrok with the following command. This will automatically start ngrok and forward the port api. Only needed if you wish to test webhooks locally.
   ```bash
   pnpm clerk:listen
   ```


### Production Setup

For production, replace the ngrok URL with your actual production URL in the Clerk Dashboard webhook settings.

## Additional Resources

For detailed information about Clerk webhooks and implementation details, see the [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks/sync-data).