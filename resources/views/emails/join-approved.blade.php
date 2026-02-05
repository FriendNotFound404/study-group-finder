<x-mail::message>
# Request Approved! 🎉

Great news!

Your request to join **"{{ $groupName }}"** has been approved!

You can now access the group workspace, participate in discussions, and collaborate with other members.

<x-mail::button :url="config('app.url') . '/groups?group=' . $groupId">
View Group Workspace
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
