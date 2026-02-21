<x-mail::message>
# Verify Your Email Address 📧

Hello {{ $userName }}!

Thank you for registering with StudyHub. To complete your registration and access all features, please verify your email address by clicking the button below.

<x-mail::button :url="$verificationUrl">
Verify Email Address
</x-mail::button>

If you did not create an account, no further action is required.

**Note:** This verification link will expire in 60 minutes.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
