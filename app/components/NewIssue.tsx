import IssueForm from './IssueForm';
import { requireUser } from '@/lib/dal';

const NewIssue = async () => {
  const user = await requireUser();

  return <IssueForm userId={user.id} />;
};

export default NewIssue;
