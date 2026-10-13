from rest_framework.routers import DefaultRouter

from .views import ChecklistItemViewSet, LabelViewSet, ProjectViewSet, TaskCommentViewSet, TaskViewSet, WorkspaceViewSet

router = DefaultRouter(trailing_slash=False)
router.register("workspaces", WorkspaceViewSet, basename="workspace")
router.register("projects", ProjectViewSet, basename="project")
router.register("labels", LabelViewSet, basename="label")
router.register("tasks", TaskViewSet, basename="task")
router.register("checklist-items", ChecklistItemViewSet, basename="checklist-item")
router.register("comments", TaskCommentViewSet, basename="comment")

urlpatterns = router.urls
