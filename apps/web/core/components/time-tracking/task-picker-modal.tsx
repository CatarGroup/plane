/**
 * Grupo Romboc / Catar BI — time tracker tipo Toggl.
 *
 * Modal de busqueda de tarea para arrancar el cronometro. A diferencia de
 * ParentIssuesListModal, busca en TODO el workspace (no un proyecto), via
 * WorkspaceService.searchEntity — el mismo endpoint que usa el buscador
 * global (Power K).
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Combobox } from "@headlessui/react";
import { SearchIcon } from "@plane/propel/icons";
import type { TIssueSearchResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import useDebounce from "@/hooks/use-debounce";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSelect: (issue: TIssueSearchResponse) => void;
};

export function TimeTrackerTaskPickerModal(props: Props) {
  const { isOpen, handleClose: onClose, onSelect } = props;
  const { workspaceSlug } = useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<TIssueSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setIssues([]);
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug) return;

    setIsSearching(true);
    workspaceService
      .searchEntity(workspaceSlug.toString(), {
        count: 20,
        query_type: ["issue"],
        query: debouncedSearchTerm,
      })
      .then((res) => setIssues(res.issue ?? []))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, workspaceSlug]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox
        value={null}
        onChange={(issue: TIssueSearchResponse) => {
          onSelect(issue);
          handleClose();
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="text-opacity-40 pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-primary"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pr-4 pl-11 text-primary outline-none placeholder:text-placeholder focus:ring-0 sm:text-13"
            placeholder="Buscar tarea para arrancar el cronometro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            displayValue={() => ""}
          />
        </div>
        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {isSearching ? (
            <Loader className="space-y-3 p-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : issues.length === 0 ? (
            <p className="p-4 text-center text-13 text-secondary">
              {debouncedSearchTerm ? "Sin resultados" : "Escribe para buscar una tarea"}
            </p>
          ) : (
            <ul className="p-2 text-13">
              {issues.map((issue) => (
                <Combobox.Option
                  key={issue.id}
                  value={issue}
                  className={({ active }) =>
                    `group my-0.5 flex w-full cursor-pointer items-center gap-2 truncate rounded-md px-3 py-2 text-secondary select-none ${
                      active ? "bg-layer-1 text-primary" : ""
                    }`
                  }
                >
                  <span className="flex-shrink-0">
                    <IssueIdentifier
                      projectId={issue.project_id}
                      issueTypeId={issue.type_id}
                      projectIdentifier={issue.project__identifier}
                      issueSequenceId={issue.sequence_id}
                      size="xs"
                      variant="secondary"
                    />
                  </span>
                  <span className="truncate">{issue.name}</span>
                </Combobox.Option>
              ))}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
    </ModalCore>
  );
}
