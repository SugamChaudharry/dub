import { PageContentOld } from "@/ui/layout/page-content";

import { MaxWidthWrapper } from "@dub/ui";
import { ProgramLinksPageClient } from "./page-client";

export default function ProgramLinks() {
  return (
    <PageContentOld title="Links" showControls>
      <MaxWidthWrapper className="pb-10">
        <ProgramLinksPageClient />
      </MaxWidthWrapper>
    </PageContentOld>
  );
}
