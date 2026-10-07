# Storiq
## Client Handover and User Guide

**Version:** 1.0  
**Document purpose:** End-user instructions, product overview, and business benefits  
**Powered by:** Reigndev

---

## 1. Welcome to Storiq

Storiq is a social media content publishing and scheduling application designed for content creators, influencers, public figures, celebrities, agencies, and social media teams.

The app provides one workspace for:

- Uploading images and videos from a phone or computer
- Preparing multiple content items at the same time
- Writing a separate caption and hashtags for every item
- Previewing content as it will appear on Instagram, Facebook, TikTok, and X
- Choosing a visual treatment and aspect ratio
- Publishing immediately or scheduling each item for a different date and time
- Reviewing all planned content in a publishing timeline
- Sending content and publishing instructions to an automated Reigndev workflow

Storiq reduces the number of manual steps needed to prepare and publish social content while giving the user control over how every post looks, reads, and is scheduled.

---

## 2. Key Benefits

### Save time

Users can prepare several images and videos in one session instead of repeating the publishing process separately for every social platform.

### Manage multiple platforms from one place

Content can be prepared for Instagram, Facebook, TikTok, and X from a single dashboard.

### Preview before publishing

Each platform has a dedicated preview that reflects its familiar layout, including profile information, captions, hashtags, engagement actions, and media presentation.

### Maintain a consistent publishing schedule

Every content item can have its own publishing date and time. The Calendar view provides a clear timeline of upcoming content.

### Keep content organized

Uploaded images and videos are placed in a content queue. Users can move between items, preview them, edit their details, or remove them before publishing.

### Customize every post

Each item keeps its own:

- Caption
- Hashtags
- Visual style
- Aspect ratio
- Publishing date
- Publishing time

Editing one item does not overwrite the settings of another item.

### Reduce publishing errors

Storiq validates files, publishing dates, platform selections, and workflow configuration before sending content for publication.

### Automate repetitive work

The Reigndev-powered publishing workflow receives the uploaded media, post metadata, platform destinations, captions, hashtags, and schedule in one structured request.

---

## 3. Supported Content and Platforms

### Supported media

- Images
- Videos
- Multiple images and videos in the same content queue

Each file must:

- Be a valid image or video format
- Contain actual file data
- Be no larger than 250 MB

### Supported social platforms

- Instagram
- Facebook
- TikTok
- X

The available publishing destinations are shown in the **Platforms** section.

> **Important:** The organization’s administrator must ensure that the required social accounts and Reigndev publishing workflow are correctly connected before live publishing.

---

## 4. Understanding the Main Navigation

### Account access

Existing users select **Sign in** and enter only their email and password.
New users select **Sign up** on the sign-in page to open the separate account
registration page. Registration requires first name, last name, phone number,
email, password, and a matching password confirmation; the request uses role `1`.
After registration succeeds, Storiq returns to sign-in with a confirmation message.
Registration alone does not sign the user in. Both pages display backend errors
without opening the studio.

Email sign-in posts to `/api/v1/auth/login`; sign-up posts to
`/api/v1/auth/register` on the configured identity API. Deployments may override
the endpoints using `VITE_AUTH_LOGIN_URL` and `VITE_AUTH_REGISTER_URL`.

Google and Facebook sign-in use Supabase OAuth, separately from the email
identity API. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's
public client configuration, enable both providers in Supabase, and allow the
app's URL in Supabase's redirect URL settings. Configure each provider's OAuth
callback URL in its developer console. Never put provider secrets or a Supabase
service-role key in `VITE_` variables.

Cancelled or failed social sign-in returns to the sign-in page with a message.
Missing profile fields are supported. Social profiles display **Plan unavailable**
until a trusted backend provides the subscription role; provider metadata does
not grant a paid plan.

### Profile and logout

Select the account avatar in the studio header to view your name, email, phone
number, and plan. Backend role `1` is **Basic**, role `2` is **Standard**, and
role `3` is **Premium**. The same plan appears in the studio header; missing or
unrecognized roles display **Plan unavailable**, never an assumed paid plan.
Profile images appear when provided by the account
service; otherwise, the avatar displays your initials. Guest sessions are labeled
**Guest** and never show another user's account details.

Select **Log out** in the profile panel to return to sign-in. Logout clears the
in-memory backend session and the current content queue, including captions,
designs, schedules, and uploaded previews. It also signs out an active social
login session. Logout is unavailable while media is being prepared or published.
Backend sessions are not saved to browser storage and require sign-in again
after a page reload. Backend logout is local only: no server token-revocation
endpoint is configured.

Storiq has two primary areas.

### Create

Use **Create** to:

- Upload content
- Manage the content queue
- Write captions and hashtags
- Select visual settings
- Preview each social platform
- Choose publishing destinations
- Schedule or immediately publish content

### Calendar

Use **Calendar** to:

- Review all planned content
- See each item’s publishing date and time
- Check selected platforms
- View draft or scheduled status
- Return to a specific item for editing

---

## 5. How to Create and Publish Content

### Step 1: Open the Create screen

Select **Create** from the left navigation menu.

The creation workspace contains three main sections:

1. **Create your post**
2. **Preview**
3. **Publish**

---

### Step 2: Upload an image or video

In **Upload your media**, select **Choose content from your phone**.

On a mobile device, this opens the available camera roll, gallery, or file browser. On a computer, it opens the system file picker.

You can:

- Select one file
- Select multiple files at once
- Add more files later by selecting **Add more**

The app automatically detects whether each uploaded file is an image or a video.

---

### Step 3: Manage the content queue

Every uploaded file appears in the **Content queue**.

To work on a specific item:

1. Select its numbered queue card.
2. Confirm that its file name appears in the selected-content panel.
3. Review the corresponding media in the Preview section.

To remove an item:

1. Select the item in the queue.
2. Select the remove icon beside its file information.

Removing an item also removes its caption, hashtags, design settings, and publishing schedule.

---

### Step 4: Choose a visual style

Use the **Visual style** selector to choose a treatment for the selected content.

Available styles include:

- **Electric editorial** — vivid color and stronger contrast
- **Clean studio** — softer saturation and a brighter presentation
- **Warm cinematic** — warmer tones and a cinematic color treatment
- **Monochrome** — black-and-white presentation with enhanced contrast

The active preview updates immediately.

Each queue item remembers its own visual style.

---

### Step 5: Choose an aspect ratio

Use the **Aspect ratio** selector to choose how the selected media is framed.

Available ratios include:

- **Portrait — 4:5**: Recommended for portrait feed posts
- **Square — 1:1**: Useful for traditional feed posts
- **Landscape — 1.91:1**: Suitable for wide-format content
- **Story — 9:16**: Suitable for vertical stories, reels, and short-form video

The active platform preview updates when the ratio changes.

Each queue item remembers its own aspect ratio.

> Platform previews may apply additional native layout rules to represent how the destination platform displays content.

---

### Step 6: Write a caption

Use the **Caption & hashtags** editor for the selected content item.

The label indicates which item is currently being edited, for example:

> For content 2 of 4

Enter the caption in the main text field. The character counter helps track caption length.

To use the provided copy suggestion, select **Write with AI**. The suggested copy can be edited before publishing.

Captions are stored separately for every uploaded item.

---

### Step 7: Add hashtags

Enter hashtags in the hashtag field.

Users can:

- Type custom hashtags
- Add suggested hashtags using **Quick add**
- Edit or remove hashtags at any time before publishing

Hashtags are stored separately for every uploaded item and appear in the platform previews.

---

## 6. Previewing Content

The Preview section shows how the selected content may appear inside each supported social app.

Use the platform tabs to switch between:

- Instagram
- Facebook
- TikTok
- X

### Instagram preview

Shows:

- Profile header
- Media
- Likes
- Caption
- Hashtags
- Comments and engagement controls

### Facebook preview

Shows:

- Profile header
- Post copy
- Media
- Reactions
- Comments and sharing controls

### TikTok preview

Shows:

- Vertical content stage
- For You navigation
- Floating engagement controls
- Caption and hashtags
- Audio attribution

### X preview

Shows:

- Timeline post structure
- Account information
- Post copy
- Media
- Replies, reposts, likes, bookmarks, and sharing controls

### Previewing videos

Uploaded videos include playback controls. On supported mobile browsers, videos play inside the preview without opening a separate page.

### Replacing media

Select **Replace** inside the media preview to choose a different image or video.

---

## 7. Choosing Publishing Platforms

In the Publish section, select one or more destination platforms.

A selected platform displays a checked state. Select it again to remove it.

The number of selected platforms is shown above the platform list.

At least one platform and one content item are required before publishing.

---

## 8. Smart Schedule

Select **Smart schedule** to publish content at planned dates and times.

### Per-content scheduling

The **Publishing timeline** automatically creates one scheduling row for every uploaded content item.

Each row includes:

- Queue number
- File name
- Publishing date
- Publishing time

To schedule multiple items:

1. Upload all required content.
2. Select **Smart schedule**.
3. Review the automatically suggested dates.
4. Set the required date and time for every item.
5. Confirm that all values are complete.
6. Select **Schedule content items**.

Each item is sent to the publishing workflow with its own timestamp.

Storiq does not allow content to be scheduled for a time that has already passed.

---

## 9. Post Now

Select **Post now** to send all queued items to the publishing workflow immediately.

When Post Now is active:

- Scheduled date and time controls are hidden
- Every queued item is marked for immediate publication
- The main action changes to **Publish items now**

Before selecting Publish, confirm:

- The correct files are in the queue
- Captions and hashtags are complete
- The correct platforms are selected
- The correct content item is shown in each preview

---

## 10. Changing the Timezone

Publishing dates and times use the timezone displayed below the publishing button.

To change it:

1. Select **Change** beside the timezone.
2. Choose the required timezone.
3. Select **Done**.

Changing the timezone updates how scheduled dates and times are converted for the automated publishing workflow.

The selected timezone is included with the publishing data sent to Reigndev.

> Review the timezone before scheduling content for audiences in another country or region.

---

## 11. Using the Calendar

Select **Calendar** from the main navigation to open the publishing timeline.

The Calendar includes:

- Total number of planned content items
- Number of selected publishing channels
- Next publishing date
- A chronological list of uploaded content
- Image thumbnails or video indicators
- Publishing dates and times
- Platform indicators
- Draft or scheduled status

### Editing an item from Calendar

1. Find the required content item.
2. Select **Edit**.
3. Storiq returns to Create and selects that item.
4. Update its caption, hashtags, style, ratio, or schedule.

If there is no uploaded content, Calendar displays an empty state with an **Add content** action.

---

## 12. Notifications

Select the bell icon in the top navigation to open Notifications.

Notifications may include:

- Publishing timeline updates
- Scheduled-content status
- Storiq connection status

Users can:

- Open Calendar from a schedule notification
- Return to Create from a connection notification
- Select **Mark all read**

The unread indicator disappears after notifications are marked as read.

---

## 13. Understanding Publishing Status

### Draft schedule

Content has publishing dates but has not yet been submitted to the automation workflow.

### Sending to Reigndev

The files and publishing instructions are being uploaded.

### Scheduled

The workflow accepted the content for future publication.

### Publishing now

The workflow is processing content for immediate publication.

### Error

The workflow could not be started or a validation requirement was not met. Read the displayed message, correct the issue, and try again.

---

## 14. What Storiq Sends for Publishing

For every content item, Storiq securely prepares:

- File name
- File type
- File size
- Actual image or video file
- Selected social platforms
- Caption
- Hashtags
- Visual style
- Aspect ratio
- Publishing date and time
- Timezone
- Publishing mode

The complete batch also includes a unique request ID. This allows the automation workflow to identify the request and helps prevent duplicate processing.

### Instagram feed image normalization in n8n

Administrators can import the optional
[Instagram feed ratio fix sub-workflow](../n8n/instagram-feed-ratio-fix.json).
Follow the [setup instructions](../n8n/README.md) to connect it before the
Instagram media upload step in the existing publishing workflow.
It center-crops JPEG, PNG, and WebP feed images to the selected portrait,
square, or landscape ratio, outputs JPEG binaries, and validates dimensions
and file size. It does not publish content or handle Story images or videos.
Keep other platforms on separate branches with their original media.

---

## 15. Recommended Workflow

For the best results:

1. Prepare all image and video files before starting.
2. Upload related content as one queue.
3. Select each item and add its individual caption and hashtags.
4. Review the visual style and aspect ratio.
5. Preview the item on every selected platform.
6. Confirm the publishing destinations.
7. Assign a date and time to each item.
8. Confirm the timezone.
9. Submit the schedule.
10. Open Calendar to review the complete publishing timeline.

---

## 16. Best Practices

### Use platform-appropriate ratios

- Use 4:5 for portrait feed content
- Use 1:1 for square posts
- Use 1.91:1 for wide posts
- Use 9:16 for vertical short-form content

### Keep captions easy to read

Use a clear opening line, short paragraphs, and a direct call to action.

### Use relevant hashtags

Choose hashtags related to the content, audience, industry, or campaign. Avoid adding unrelated hashtags only because they are popular.

### Review every preview

Text length, media cropping, and layout can vary by platform. Check all selected destinations before scheduling.

### Space scheduled content appropriately

Avoid scheduling too many items at the same time unless the campaign specifically requires simultaneous publishing.

### Confirm the timezone

Always verify the selected timezone when managing accounts or audiences in different countries.

---

## 17. Troubleshooting

### The publishing button is disabled

Check that:

- At least one file is uploaded
- At least one platform is selected
- Every scheduled item has a date and time
- No upload is currently in progress

### A file cannot be uploaded

Confirm that:

- It is an image or video
- The file is not empty
- It is smaller than 250 MB

### The schedule is rejected

Confirm that:

- Every publishing date and time is in the future
- The selected timezone is correct

### Content cannot reach the publishing workflow

If the app cannot reach the webhook, the publishing panel reports **Storiq disconnected**. Common causes include:

- No live Reigndev webhook configured
- Internet connection failure
- Workflow timeout
- Server or workflow error
- Publishing integration temporarily unavailable

Contact the application administrator or Reigndev support if the problem continues.

### A preview does not match the final social post exactly

Platform previews are visual simulations. Social platforms may apply their own compression, cropping, font rendering, interface updates, or media processing during publication.

---

## 18. Frequently Asked Questions

### Can I upload more than one file?

Yes. Select multiple files in one upload or use **Add more**.

### Can every item have a different caption?

Yes. Select the item in the content queue and edit its caption and hashtags.

### Can every item have a different publishing time?

Yes. Smart Schedule provides separate date and time controls for every uploaded item.

### Can I preview a video?

Yes. The Preview section includes video playback controls.

### Can I post immediately?

Yes. Select **Post now** and then use the immediate publishing action.

### Can I change a scheduled item?

Yes. Open Calendar, locate the item, and select **Edit**.

### Which platforms are supported?

Instagram, Facebook, TikTok, and X.

### What does “Storiq connected” mean?

It indicates that the app is ready to communicate with its publishing automation. Live publishing still depends on the organization’s configured workflow and connected social accounts.

---

## 19. Client Handover Checklist

Before giving Storiq to end users, the client administrator should confirm:

- [ ] The production Reigndev webhook is configured
- [ ] The webhook uses HTTPS
- [ ] Required social accounts are connected
- [ ] Instagram publishing is tested
- [ ] Facebook publishing is tested
- [ ] TikTok publishing is tested
- [ ] X publishing is tested
- [ ] Immediate publishing is tested
- [ ] Scheduled publishing is tested
- [ ] Multiple-file uploads are tested
- [ ] Timezone conversion is tested
- [ ] The workflow returns a successful response to Storiq
- [ ] Error monitoring and support ownership are defined

---

## 20. Support

For account access, publishing failures, workflow configuration, or technical assistance, contact the designated Storiq administrator or Reigndev support representative.

When reporting an issue, include:

- The approximate time of the attempt
- The selected publishing mode
- The selected platforms
- The number and type of uploaded files
- The error message displayed by Storiq
- The timezone used for scheduling

Do not send private account credentials or access tokens in a support message.

---

## Product Summary

Storiq gives creators and social media teams a single, organized workflow for preparing, previewing, scheduling, and publishing multi-platform content. Its per-content controls, native platform previews, multi-item publishing timeline, and Reigndev-powered automation help users publish more consistently while spending less time on repetitive manual work.

**Storiq — create once, prepare with confidence, and publish everywhere.**
