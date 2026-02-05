<x-mail::message>
# Membership Status Update

Hello,

You have been removed from the study group **"{{ $groupName }}"** by the group leader.

If you believe this was done in error, please contact the group leader directly. You can explore other study groups that might be a good fit for you!

<x-mail::button :url="config('app.url')">
Browse Other Groups
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
