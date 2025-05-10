# Setting Up DigitalOcean Spaces for File Storage

This project uses DigitalOcean Spaces as a storage service for file uploads. To make it work, you need to set up the proper environment variables.

## 1. Create a DigitalOcean Account and Space

1. If you don't have a DigitalOcean account, [sign up here](https://cloud.digitalocean.com/registrations/new)
2. Create a new Space:
   - Go to "Spaces" in the DigitalOcean dashboard
   - Click "Create a Space"
   - Choose a region close to your users (example: `nyc3`)
   - Give your Space a unique name (example: `myproject-files`)
   - Choose file listing (private is recommended)
   - Click "Create a Space"

## 2. Generate Spaces Access Keys

1. In the DigitalOcean dashboard, go to "API" in the left menu
2. Under "Spaces access keys", click "Generate New Key" 
3. Enter a name for your key (example: `myproject-spaces-key`)
4. Copy both the Access Key and Secret Key - you'll need these for your environment variables

## 3. Configure Environment Variables

Create or edit your `.env.local` file in the root of your project with the following variables:

```
# DigitalOcean Spaces Configuration
SPACES_KEY=your_access_key
SPACES_SECRET=your_secret_key
SPACES_REGION=nyc3  # Replace with your chosen region
SPACES_NAME=your-spaces-name  # Replace with your space name
NEXT_PUBLIC_SPACES_REGION=nyc3  # Replace with your chosen region
NEXT_PUBLIC_SPACES_NAME=your-spaces-name  # Replace with your space name
```

## 4. CORS Configuration (If Needed)

If you experience CORS issues with your Space, you need to configure CORS settings:

1. In your Space's settings, click on "Settings" and then "CORS"
2. Add your application domain (example: `https://yourapp.com`) or use `*` for development
3. Allow the following methods: `GET`, `PUT`, `POST`
4. Save the CORS settings

## 5. Testing the Connection

After setting up your environment variables, restart your development server and try uploading a file. If you encounter issues:

1. Check the browser console for error messages
2. Verify that all environment variables are correctly set
3. Make sure your Space permissions are properly configured
4. Verify that the Space region matches your environment variable

## Troubleshooting Common Issues

- **401 Unauthorized**: Check your access key and secret key
- **403 Forbidden**: Check permissions on your Space
- **CORS errors**: Configure CORS settings for your Space
- **File too large**: Adjust max file size settings in your API route (default is 100MB)

For more information, refer to the [DigitalOcean Spaces documentation](https://docs.digitalocean.com/products/spaces/). 