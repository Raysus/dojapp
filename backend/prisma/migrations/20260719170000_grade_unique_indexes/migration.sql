-- Deduplicate grades by (styleId, order) keeping the oldest row.
DELETE FROM "Grade" g
USING "Grade" h
WHERE g."styleId" = h."styleId"
  AND g."order" = h."order"
  AND g."id" > h."id";

-- Deduplicate grades by (styleId, name) keeping the oldest row.
DELETE FROM "Grade" g
USING "Grade" h
WHERE g."styleId" = h."styleId"
  AND g."name" = h."name"
  AND g."id" > h."id";

CREATE UNIQUE INDEX "Grade_styleId_order_key" ON "Grade"("styleId", "order");
CREATE UNIQUE INDEX "Grade_styleId_name_key" ON "Grade"("styleId", "name");

CREATE INDEX "Content_styleId_gradeId_idx" ON "Content"("styleId", "gradeId");
CREATE INDEX "DojoMembership_dojoId_role_idx" ON "DojoMembership"("dojoId", "role");
